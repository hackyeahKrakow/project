import json
from pathlib import Path

import pytest

from app.schemas import CardFetchResponse
from app.seed import SEED_CARDS, SEED_FILE, STARTER_CARDS, STARTER_COUNT

DATA_COPY = Path(__file__).resolve().parents[3] / "data" / "events_oneoff.json"


@pytest.mark.skipif(not DATA_COPY.exists(), reason="data/ is outside the deployed backend directory")
def test_seed_file_matches_the_shared_data_file():
    assert json.loads(SEED_FILE.read_text(encoding="utf-8")) == json.loads(
        DATA_COPY.read_text(encoding="utf-8")
    )


def test_catalog_has_unique_ids_and_real_times():
    assert len(SEED_CARDS) == 25
    assert len({card.id for card in SEED_CARDS}) == 25
    # every event has a real start time from its listing, not a midnight placeholder
    assert all((c.starts_at.hour, c.starts_at.minute) != (0, 0) for c in SEED_CARDS)


def test_the_first_six_are_the_starter_cards():
    assert STARTER_COUNT == 6
    assert STARTER_CARDS == SEED_CARDS[:6]


def test_every_card_is_valid_in_the_api():
    for card in SEED_CARDS:
        assert CardFetchResponse.model_validate(card).id == card.id
