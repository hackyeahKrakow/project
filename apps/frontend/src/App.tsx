import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Frontend is running</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Type something" />
          <Button>Go</Button>
        </CardContent>
      </Card>
    </main>
  )
}
