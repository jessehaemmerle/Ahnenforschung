"use client";

import type { Gender, PrivacyStatus, RelationshipStatus, RelationshipType } from "@prisma/client";
import { Lightbulb, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PersonDto, RelationshipDto } from "@/types/family-tree";
import { relationshipLabels, relationshipTypes } from "./relationship-style";

function dateValue(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function PersonDetailPanel({
  person,
  canEdit,
  onSave,
  onDelete,
  onAddParent,
  onAddPartner,
  onAddChild
}: {
  person: PersonDto | null;
  canEdit: boolean;
  onSave: (personId: string, payload: Partial<PersonDto>) => void;
  onDelete: (personId: string) => void;
  onAddParent: (person: PersonDto) => void;
  onAddPartner: (person: PersonDto) => void;
  onAddChild: (person: PersonDto) => void;
}) {
  if (!person) {
    return (
      <aside className="w-full shrink-0 border-l bg-card p-4 lg:w-80">
        <h2 className="font-bold">Details</h2>
        <p className="mt-2 text-sm text-muted-foreground">Keine Auswahl</p>
      </aside>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    const form = new FormData(event.currentTarget);
    onSave(person.id, {
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
      birthName: String(form.get("birthName") || ""),
      gender: String(form.get("gender")) as Gender,
      birthDate: String(form.get("birthDate") || ""),
      birthPlace: String(form.get("birthPlace") || ""),
      deathDate: String(form.get("deathDate") || ""),
      deathPlace: String(form.get("deathPlace") || ""),
      profession: String(form.get("profession") || ""),
      address: String(form.get("address") || ""),
      originPlace: String(form.get("originPlace") || ""),
      biography: String(form.get("biography") || ""),
      privacy: String(form.get("privacy")) as PrivacyStatus,
      tags: String(form.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
  }

  return (
    <aside className="w-full shrink-0 overflow-auto border-l bg-card p-4 lg:w-96">
      <form key={person.id} onSubmit={submit} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">Person</h2>
            <p className="text-sm text-muted-foreground">{person.firstName} {person.lastName}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" disabled={!canEdit} onClick={() => onDelete(person.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vorname" name="firstName" defaultValue={person.firstName} disabled={!canEdit} />
          <Field label="Nachname" name="lastName" defaultValue={person.lastName} disabled={!canEdit} />
        </div>
        <Field label="Geburtsname" name="birthName" defaultValue={person.birthName ?? ""} disabled={!canEdit} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Geschlecht</Label>
            <Select name="gender" defaultValue={person.gender} disabled={!canEdit}>
              {["UNKNOWN", "MALE", "FEMALE", "DIVERSE"].map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Datenschutz</Label>
            <Select name="privacy" defaultValue={person.privacy} disabled={!canEdit}>
              {["TENANT", "PRIVATE", "ADMINS"].map((privacy) => (
                <option key={privacy} value={privacy}>{privacy}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Geburtsdatum" name="birthDate" type="date" defaultValue={dateValue(person.birthDate)} disabled={!canEdit} />
          <Field label="Sterbedatum" name="deathDate" type="date" defaultValue={dateValue(person.deathDate)} disabled={!canEdit} />
        </div>
        <Field label="Geburtsort" name="birthPlace" defaultValue={person.birthPlace ?? ""} disabled={!canEdit} />
        <Field label="Sterbeort" name="deathPlace" defaultValue={person.deathPlace ?? ""} disabled={!canEdit} />
        <Field label="Beruf" name="profession" defaultValue={person.profession ?? ""} disabled={!canEdit} />
        <Field label="Adresse / Herkunft" name="address" defaultValue={person.address ?? ""} disabled={!canEdit} />
        <Field label="Herkunftsort" name="originPlace" defaultValue={person.originPlace ?? ""} disabled={!canEdit} />
        <Field label="Tags" name="tags" defaultValue={Array.isArray(person.tags) ? person.tags.join(", ") : ""} disabled={!canEdit} />
        <div className="space-y-2">
          <Label>Biografie / Notizen</Label>
          <Textarea name="biography" defaultValue={person.biography ?? ""} disabled={!canEdit} />
        </div>
        <div className="rounded-md border bg-secondary p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lightbulb className="h-4 w-4" />
            Vorschläge
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => onAddParent(person)}>Eltern</Button>
            <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => onAddPartner(person)}>Partner</Button>
            <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => onAddChild(person)}>Kind</Button>
          </div>
        </div>
        <Button disabled={!canEdit} className="w-full">Speichern</Button>
      </form>
    </aside>
  );
}

export function RelationshipDetailPanel({
  relationship,
  canEdit,
  onSave,
  onDelete
}: {
  relationship: RelationshipDto | null;
  canEdit: boolean;
  onSave: (relationshipId: string, payload: Partial<RelationshipDto>) => void;
  onDelete: (relationshipId: string) => void;
}) {
  if (!relationship) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!relationship) return;
    const form = new FormData(event.currentTarget);
    onSave(relationship.id, {
      type: String(form.get("type")) as RelationshipType,
      status: String(form.get("status")) as RelationshipStatus,
      startDate: String(form.get("startDate") || ""),
      endDate: String(form.get("endDate") || ""),
      place: String(form.get("place") || ""),
      description: String(form.get("description") || ""),
      sourceNote: String(form.get("sourceNote") || "")
    });
  }

  return (
    <aside className="w-full shrink-0 overflow-auto border-l bg-card p-4 lg:w-96">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">Beziehung</h2>
            <p className="text-sm text-muted-foreground">{relationshipLabels[relationship.type]}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" disabled={!canEdit} onClick={() => onDelete(relationship.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Typ</Label>
          <Select name="type" defaultValue={relationship.type} disabled={!canEdit}>
            {relationshipTypes.map((type) => (
              <option key={type} value={type}>{relationshipLabels[type]}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select name="status" defaultValue={relationship.status} disabled={!canEdit}>
            {["ACTIVE", "ENDED", "UNKNOWN"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" name="startDate" type="date" defaultValue={dateValue(relationship.startDate)} disabled={!canEdit} />
          <Field label="Ende" name="endDate" type="date" defaultValue={dateValue(relationship.endDate)} disabled={!canEdit} />
        </div>
        <Field label="Ort" name="place" defaultValue={relationship.place ?? ""} disabled={!canEdit} />
        <div className="space-y-2">
          <Label>Notiz</Label>
          <Textarea name="description" defaultValue={relationship.description ?? ""} disabled={!canEdit} />
        </div>
        <div className="space-y-2">
          <Label>Quelle</Label>
          <Textarea name="sourceNote" defaultValue={relationship.sourceNote ?? ""} disabled={!canEdit} />
        </div>
        <Button disabled={!canEdit} className="w-full">Speichern</Button>
      </form>
    </aside>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  disabled
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input name={name} type={type} defaultValue={defaultValue} disabled={disabled} />
    </div>
  );
}
