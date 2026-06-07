import type { PersonDto, RelationshipDto } from "@/types/family-tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

function ageAtDeath(person: PersonDto) {
  if (!person.birthDate) return null;
  const end = person.deathDate ? new Date(person.deathDate) : new Date();
  const start = new Date(person.birthDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.floor((end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function topValue(people: PersonDto[], selector: (person: PersonDto) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const person of people) {
    const value = selector(person)?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Keine Daten";
}

export function TreeInsights({ people, relationships }: { people: PersonDto[]; relationships: RelationshipDto[] }) {
  const ages = people.map(ageAtDeath).filter((age): age is number => age !== null && age >= 0);
  const oldest = [...people]
    .map((person) => ({ person, age: ageAtDeath(person) ?? -1 }))
    .sort((a, b) => b.age - a.age)[0];
  const averageAge = ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null;
  const timeline = [
    ...people.flatMap((person) => [
      person.birthDate
        ? {
            date: person.birthDate,
            title: `Geburt: ${person.firstName} ${person.lastName}`,
            place: person.birthPlace
          }
        : null,
      person.deathDate
        ? {
            date: person.deathDate,
            title: `Tod: ${person.firstName} ${person.lastName}`,
            place: person.deathPlace
          }
        : null
    ]),
    ...relationships
      .filter((relationship) => relationship.startDate)
      .map((relationship) => ({
        date: relationship.startDate,
        title: `Beziehung: ${relationship.type}`,
        place: relationship.place
      }))
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(a!.date as string).getTime() - new Date(b!.date as string).getTime())
    .slice(0, 8);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="Personen" value={people.length} />
        <Stat title="Beziehungen" value={relationships.length} />
        <Stat title="Älteste Person" value={oldest?.age && oldest.age > 0 ? `${oldest.age} Jahre` : "Keine Daten"} />
        <Stat title="Durchschnittsalter" value={averageAge ? `${averageAge} Jahre` : "Keine Daten"} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="max-h-52 space-y-3 overflow-auto">
          {timeline.map((entry, index) => (
            <div key={`${entry!.title}-${index}`} className="border-l-2 border-primary pl-3">
              <p className="text-sm font-semibold">{entry!.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(entry!.date as string)} {entry!.place ? `· ${entry!.place}` : ""}
              </p>
            </div>
          ))}
          {!timeline.length ? <p className="text-sm text-muted-foreground">Noch keine Ereignisse.</p> : null}
        </CardContent>
      </Card>
      <div className="xl:col-span-2 grid gap-4 md:grid-cols-2">
        <Stat title="Häufigster Nachname" value={topValue(people, (person) => person.lastName)} />
        <Stat title="Häufigster Geburtsort" value={topValue(people, (person) => person.birthPlace)} />
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-extrabold">{value}</CardContent>
    </Card>
  );
}
