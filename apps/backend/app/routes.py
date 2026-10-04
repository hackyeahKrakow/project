from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, Response, status
from pydantic.types import UUID7
from sqlalchemy.ext.asyncio import AsyncSession

from app.card_service import AlreadyAnsweredError, CardNotFoundError, get_next_card, record_swipe
from app.database import get_session
from app.event_parser import (
    EventDraft,
    EventParser,
    ParseRequest,
    ParserError,
    get_event_parser,
    warsaw_today,
)
from app.fallback_decider import FallbackDecider, get_fallback_decider
from app.geocode import GeocodeError, Geocoder, Place, get_geocoder
from app.info_service import MAX_INFO_CHARS, InfoTooLargeError, save_info
from app.jev_client import JevClient, get_jev_client
from app.logger import get_logger
from app.recommender import get_recommendations
from app.parking import ParkingError, ParkingFinder, ParkingNear, get_parking_finder
from app.route import Planner, RouteError, RoutePlan, get_planner
from app.transit import Transit, TransitError, TransitNear, get_transit
from app.schemas import (
    CardFetchResponse,
    CardResponseOut,
    CardResponseRequest,
    ErrorResponse,
    HealthResponse,
    InfoOut,
)

router = APIRouter()

UserId = Annotated[
    UUID7,
    Path(
        description="Identifier of the user (UUID7)",
        examples=["018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90"],
    ),
]
log = get_logger(__name__)


@router.get(
    "/health",
    operation_id="health",
    summary="Health check",
    description="Returns `ok` when the service is running.",
    response_model=HealthResponse,
)
async def health() -> HealthResponse:
    log.info("health_checked")
    return HealthResponse(status="ok")


@router.get(
    "/card/new/{user_id}",
    operation_id="card_new",
    summary="Get the next card in the fixed sequence",
    description=(
        "Returns the next of six predefined cards (numbered 1 to 6) for this user, in order. "
        "The service remembers each user's position, so a card is never returned twice to the "
        "same user. After card 6 it returns 404."
    ),
    response_model=CardFetchResponse,
    responses={
        404: {"model": ErrorResponse, "description": "No more cards"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def card_new(
    user_id: UserId, session: Annotated[AsyncSession, Depends(get_session)]
) -> CardFetchResponse:
    card = await get_next_card(session, user_id)
    if card is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No more cards")
    return CardFetchResponse.model_validate(card)


@router.get(
    "/card/recommendations/{user_id}",
    operation_id="card_recommendations",
    summary="Get up to 10 recommended cards for a user",
    description=(
        "Draws up to 50 random cards the user has not answered, evaluates them with the Jev "
        "model using the user's earlier right (interested) and left (not interested) answers, "
        "and returns the 10 best matches in ranked order. Returns fewer cards when fewer "
        "candidates exist and an empty list when none exist. Cards Jev is not confident about "
        "(confidence below JEV_MIN_CONFIDENCE, 50% by default) are decided by the fallback model on "
        "OpenRouter when OPENROUTER_API_KEY is set. If the AI is unavailable the result is up to "
        "10 random candidates."
    ),
    response_model=list[CardFetchResponse],
    responses={422: {"model": ErrorResponse, "description": "Invalid request"}},
)
async def card_recommendations(
    user_id: UserId,
    session: Annotated[AsyncSession, Depends(get_session)],
    jev: Annotated[JevClient, Depends(get_jev_client)],
    fallback: Annotated[FallbackDecider | None, Depends(get_fallback_decider)],
) -> list[CardFetchResponse]:
    cards = await get_recommendations(session, jev, user_id, fallback)
    return [CardFetchResponse.model_validate(card) for card in cards]


@router.get(
    "/card/{user_id}",
    operation_id="card_fetch",
    summary="Get the next card for a user",
    description="Returns exactly one event card the user has not responded to yet.",
    response_model=CardFetchResponse,
    responses={
        404: {"model": ErrorResponse, "description": "No more cards for this user"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
        501: {"model": ErrorResponse, "description": "Not implemented yet"},
    },
)
async def card_fetch(user_id: UserId) -> CardFetchResponse:
    log.info("card_fetch_called", user_id=str(user_id))
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")


@router.post(
    "/card/{user_id}",
    operation_id="card_response",
    summary="Respond to a card",
    description=(
        "Saves the user's swipe for a card (`right` stored as true, `left` as false) with the "
        "time of saving. A user can answer a card only once."
    ),
    status_code=status.HTTP_201_CREATED,
    response_model=CardResponseOut,
    responses={
        404: {"model": ErrorResponse, "description": "Card not found"},
        409: {"model": ErrorResponse, "description": "User already answered this card"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def card_response(
    user_id: UserId,
    body: CardResponseRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CardResponseOut:
    try:
        swipe = await record_swipe(session, user_id, body.card_id, body.decision)
    except CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Card not found") from None
    except AlreadyAnsweredError:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Card already answered") from None
    return CardResponseOut.from_swipe(swipe)


@router.post(
    "/events/parse",
    operation_id="events_parse",
    summary="Fill an event form from a post (AI)",
    description=(
        "Sends the organizer's post to a chat model and returns a draft event. Fields the model "
        "could not find or was unsure about are listed in `missing_fields`. Nothing is saved: a "
        "person checks and approves the draft. Returns 503 when the AI is unavailable."
    ),
    response_model=EventDraft,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "AI unavailable"},
    },
)
async def events_parse(
    body: ParseRequest, parser: Annotated[EventParser, Depends(get_event_parser)]
) -> EventDraft:
    try:
        draft = await parser.parse(body.text, warsaw_today())
    except ParserError as exc:
        log.warning("parse_failed", reason=str(exc))
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI unavailable") from None
    log.info("parse_done", missing=len(draft.missing_fields))
    return draft


@router.get(
    "/geocode",
    operation_id="geocode",
    summary="Address suggestions in Kraków",
    description=(
        "Returns up to 5 places matching the typed address, limited to Kraków. Data comes from "
        "OpenStreetMap through Photon; results are cached and the server asks Photon at most once "
        "per second. Returns 503 when the geocoder is unavailable."
    ),
    response_model=list[Place],
    responses={
        422: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "Geocoder unavailable"},
    },
)
async def geocode(
    geocoder: Annotated[Geocoder, Depends(get_geocoder)],
    q: Annotated[str, Query(min_length=3, max_length=120, description="Typed address")],
    response: Response,
) -> list[Place]:
    try:
        places = await geocoder.search(q)
    except GeocodeError as exc:
        log.warning("geocode_failed", reason=str(exc))
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="Geocoder unavailable") from None
    # Same answer for everyone: Vercel's CDN serves repeats for a day without invoking the function (Hobby limits).
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=86400"
    return places


@router.post(
    "/info/{user_id}",
    operation_id="info_save",
    summary="Save what the user told us (JSON)",
    description=(
        "Accepts any JSON document and saves it for this user, replacing the previous one. It is "
        "passed to the Jev model as the user's choices, next to their right and left answers, when "
        "recommendations are computed, so it can change which cards are recommended. The document "
        "is sent to the AI as it is, so it must not contain personal data or a location. "
        f"At most {MAX_INFO_CHARS} characters once serialized."
    ),
    response_model=InfoOut,
    responses={
        413: {"model": ErrorResponse, "description": "The JSON is too large"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def info_save(
    user_id: UserId,
    body: Annotated[
        Any,
        Body(
            description="Any JSON document",
            examples=[{"interests": ["koncerty", "kabaret"], "budget": "do 50 zł"}],
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InfoOut:
    try:
        updated_at = await save_info(session, user_id, body)
    except InfoTooLargeError:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"JSON is larger than {MAX_INFO_CHARS} characters",
        ) from None
    log.info("info_saved")
    return InfoOut(user_id=user_id, updated_at=updated_at)


@router.get(
    "/transit/near",
    operation_id="transit_near",
    summary="Public transport near an event",
    description=(
        "Nearest tram and bus stop (within 1.5 km) and current disruptions at stops within 400 m. "
        "Data comes from ZTP Kraków open data: GTFS timetables (cached for a day) and GTFS-Realtime "
        "ServiceAlerts (cached for 2 minutes). Returns 503 when the stop list can't be loaded."
    ),
    response_model=TransitNear,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "ZTP data unavailable"},
    },
)
async def transit_near(
    transit: Annotated[Transit, Depends(get_transit)],
    lat: Annotated[float, Query(ge=49.9, le=50.2, description="Event latitude (Kraków area)")],
    lng: Annotated[float, Query(ge=19.7, le=20.3, description="Event longitude (Kraków area)")],
) -> TransitNear:
    try:
        return await transit.near(lat, lng)
    except TransitError as exc:
        log.warning("transit_failed", reason=str(exc))
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="ZTP data unavailable") from None


@router.get(
    "/route",
    operation_id="route",
    summary="Public transport journey to an event",
    description=(
        "Up to 3 public transport options from the user's position to the event, arriving by `time` "
        "(or leaving at `time` with `arrive_by=false`), plus how long walking the whole way takes. "
        "Journeys come from Transitous (MOTIS over the ZTP Kraków GTFS with live delays). With "
        "`wheelchair=true` walking parts are step-free and options with a known high-floor vehicle go last. "
        "The position is passed on to Transitous for this one request and is neither stored nor logged."
    ),
    response_model=RoutePlan,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "Journey planner unavailable"},
    },
)
async def route(
    planner: Annotated[Planner, Depends(get_planner)],
    from_lat: Annotated[float, Query(ge=49.9, le=50.2, description="Start latitude (Kraków area)")],
    from_lng: Annotated[float, Query(ge=19.7, le=20.3, description="Start longitude (Kraków area)")],
    to_lat: Annotated[float, Query(ge=49.9, le=50.2, description="Event latitude")],
    to_lng: Annotated[float, Query(ge=19.7, le=20.3, description="Event longitude")],
    time: Annotated[datetime, Query(description="Arrival time (or departure time with arrive_by=false), ISO 8601 with offset")],
    arrive_by: bool = True,
    wheelchair: bool = False,
) -> RoutePlan:
    try:
        return await planner.plan((from_lat, from_lng), (to_lat, to_lng), time, arrive_by, wheelchair)
    except RouteError as exc:
        log.warning("route_failed", reason=str(exc))
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="Journey planner unavailable") from None


@router.get(
    "/parking/near",
    operation_id="parking_near",
    summary="Car parks and spaces for people with disabilities near an event",
    description=(
        "Public car parks within 800 m (name, distance, spaces, spaces for people with disabilities, fee, P+R) "
        "and the number of mapped on-street spaces for people with disabilities within 400 m. Data comes from "
        "OpenStreetMap through Overpass, cached for a day per place. Returns 503 when Overpass is unavailable."
    ),
    response_model=ParkingNear,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "Overpass unavailable"},
    },
)
async def parking_near(
    finder: Annotated[ParkingFinder, Depends(get_parking_finder)],
    lat: Annotated[float, Query(ge=49.9, le=50.2, description="Event latitude (Kraków area)")],
    lng: Annotated[float, Query(ge=19.7, le=20.3, description="Event longitude (Kraków area)")],
) -> ParkingNear:
    try:
        return await finder.near(lat, lng)
    except ParkingError as exc:
        log.warning("parking_failed", reason=str(exc))
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="Overpass unavailable") from None
