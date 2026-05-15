import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="bg-background flex h-screen items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Hello — AI Training Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Pelago internal learning platform — coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
