"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Connection, Edge, Node, ReactFlowInstance } from "@xyflow/react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState
} from "@xyflow/react";
import type { ComponentType } from "react";
import type { NodeTypes } from "@xyflow/react";
import type { RelationshipType } from "@prisma/client";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import type { FamilyTreeEditorData, PersonDto, RelationshipDto } from "@/types/family-tree";
import { PersonNodeCard } from "./person-node-card";
import { EditorToolbar } from "./editor-toolbar";
import { EditorSidebar } from "./editor-sidebar";
import { PersonDetailPanel, RelationshipDetailPanel } from "./detail-panel";
import {
  apiUrl,
  canEditRole,
  cloneState,
  download,
  parseError,
  personToNode,
  relationshipToEdge,
  tagsOf,
  type EditorHistory
} from "./editor-utils";
import { NodeContextMenu, type NodeContextMenuState } from "./node-context-menu";

const nodeTypes: NodeTypes = { person: PersonNodeCard as ComponentType<any> };

export function FamilyTreeEditor(props: FamilyTreeEditorData) {
  return (
    <ReactFlowProvider>
      <EditorCanvas {...props} />
    </ReactFlowProvider>
  );
}

function EditorCanvas(initialData: FamilyTreeEditorData) {
  const canEdit = canEditRole(initialData.role);
  const [people, setPeople] = useState<PersonDto[]>(initialData.people);
  const [relationships, setRelationships] = useState<RelationshipDto[]>(initialData.relationships);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.people.map(personToNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.relationships.map(relationshipToEdge));
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(initialData.people[0]?.id ?? null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("PARENT_OF");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<NodeContextMenuState | null>(null);
  const [history, setHistory] = useState<EditorHistory[]>([cloneState(initialData.people, initialData.relationships)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);
  const flowInstance = useRef<ReactFlowInstance<Node<{ person: PersonDto }>, Edge> | null>(null);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) ?? null,
    [people, selectedPersonId]
  );
  const selectedRelationship = useMemo(
    () => relationships.find((relationship) => relationship.id === selectedRelationshipId) ?? null,
    [relationships, selectedRelationshipId]
  );

  const visiblePersonIds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedTag = tagFilter.trim().toLowerCase();
    return new Set(
      people
        .filter((person) => {
          const text = [person.firstName, person.lastName, person.birthPlace, person.profession, person.originPlace]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const matchesQuery = normalizedQuery ? text.includes(normalizedQuery) : true;
          const matchesTag = normalizedTag ? tagsOf(person).some((tag) => tag.toLowerCase().includes(normalizedTag)) : true;
          return matchesQuery && matchesTag;
        })
        .map((person) => person.id)
    );
  }, [people, query, tagFilter]);

  useEffect(() => {
    setNodes((current) =>
      current
        .filter((node) => people.some((person) => person.id === node.id))
        .map((node) => {
          const person = people.find((entry) => entry.id === node.id);
          return person
            ? {
                ...node,
                hidden: !visiblePersonIds.has(node.id),
                data: { person },
                position: { x: person.x, y: person.y }
              }
            : node;
        })
    );
  }, [people, setNodes, visiblePersonIds]);

  useEffect(() => {
    setEdges(
      relationships
        .filter((relationship) => visiblePersonIds.has(relationship.sourcePersonId) && visiblePersonIds.has(relationship.targetPersonId))
        .map(relationshipToEdge)
    );
  }, [relationships, setEdges, visiblePersonIds]);

  const pushHistory = useCallback(
    (nextPeople: PersonDto[], nextRelationships: RelationshipDto[]) => {
      const next = cloneState(nextPeople, nextRelationships);
      setHistory((current) => [...current.slice(0, historyIndex + 1), next].slice(-50));
      setHistoryIndex((index) => Math.min(index + 1, 49));
    },
    [historyIndex]
  );

  const markDirty = useCallback((nextPeople: PersonDto[], nextRelationships = relationships) => {
    setDirty(true);
    pushHistory(nextPeople, nextRelationships);
  }, [pushHistory, relationships]);

  const savePositions = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    const response = await fetch(apiUrl(initialData, "/snapshot"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        people: people.map((person) => ({ id: person.id, x: person.x, y: person.y }))
      })
    });
    setSaving(false);

    if (!response.ok) {
      toast.error(await parseError(response));
      return;
    }
    setDirty(false);
  }, [canEdit, initialData, people]);

  useEffect(() => {
    if (!dirty || !canEdit) return;
    const timer = window.setTimeout(() => void savePositions(), 1600);
    return () => window.clearTimeout(timer);
  }, [dirty, canEdit, savePositions]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const deletePerson = useCallback(
    async (personId: string) => {
      if (!canEdit) return;
      const response = await fetch(apiUrl(initialData, `/people/${personId}`), { method: "DELETE" });
      if (!response.ok) {
        toast.error(await parseError(response));
        return;
      }
      const nextPeople = people.filter((person) => person.id !== personId);
      const nextRelationships = relationships.filter(
        (relationship) => relationship.sourcePersonId !== personId && relationship.targetPersonId !== personId
      );
      setPeople(nextPeople);
      setRelationships(nextRelationships);
      setSelectedPersonId(nextPeople[0]?.id ?? null);
      pushHistory(nextPeople, nextRelationships);
      toast.success("Person gelöscht.");
    },
    [canEdit, initialData, people, pushHistory, relationships]
  );

  const deleteRelationship = useCallback(
    async (relationshipId: string) => {
      if (!canEdit) return;
      const response = await fetch(apiUrl(initialData, `/relationships/${relationshipId}`), { method: "DELETE" });
      if (!response.ok) {
        toast.error(await parseError(response));
        return;
      }
      const nextRelationships = relationships.filter((relationship) => relationship.id !== relationshipId);
      setRelationships(nextRelationships);
      setSelectedRelationshipId(null);
      pushHistory(people, nextRelationships);
      toast.success("Beziehung gelöscht.");
    },
    [canEdit, initialData, people, pushHistory, relationships]
  );

  const addPerson = useCallback(
    async (preset?: Partial<PersonDto>) => {
      if (!canEdit) return null;
      const viewport = flowInstance.current?.getViewport();
      const x = preset?.x ?? (viewport ? -viewport.x / viewport.zoom + 120 : 120);
      const y = preset?.y ?? (viewport ? -viewport.y / viewport.zoom + 120 : 120);
      const response = await fetch(apiUrl(initialData, "/people?allowDuplicate=true"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: preset?.firstName ?? "Neue",
          lastName: preset?.lastName ?? "Person",
          gender: preset?.gender ?? "UNKNOWN",
          privacy: preset?.privacy ?? "TENANT",
          tags: preset?.tags ?? [],
          customData: preset?.customData ?? {},
          x,
          y
        })
      });
      if (!response.ok) {
        toast.error(await parseError(response));
        return null;
      }
      const body = (await response.json()) as { person: PersonDto };
      const nextPeople = [...people, body.person];
      setPeople(nextPeople);
      setSelectedPersonId(body.person.id);
      setSelectedRelationshipId(null);
      pushHistory(nextPeople, relationships);
      toast.success("Person hinzugefügt.");
      return body.person;
    },
    [canEdit, initialData, people, pushHistory, relationships]
  );

  const createRelationship = useCallback(
    async (sourcePersonId: string, targetPersonId: string, type = relationshipType) => {
      if (!canEdit || sourcePersonId === targetPersonId) return null;
      const response = await fetch(apiUrl(initialData, "/relationships"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourcePersonId,
          targetPersonId,
          type,
          status: "UNKNOWN",
          privacy: "TENANT",
          metadata: {}
        })
      });
      if (!response.ok) {
        toast.error(await parseError(response));
        return null;
      }
      const body = (await response.json()) as { relationship: RelationshipDto; warnings?: { message: string }[] };
      const nextRelationships = [...relationships, body.relationship];
      setRelationships(nextRelationships);
      setSelectedRelationshipId(body.relationship.id);
      setSelectedPersonId(null);
      pushHistory(people, nextRelationships);
      body.warnings?.forEach((warning) => toast.warning(warning.message));
      toast.success("Beziehung erstellt.");
      return body.relationship;
    },
    [canEdit, initialData, people, pushHistory, relationshipType, relationships]
  );

  const savePerson = useCallback(
    async (personId: string, payload: Partial<PersonDto>) => {
      const response = await fetch(apiUrl(initialData, `/people/${personId}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        toast.error(await parseError(response));
        return;
      }
      const body = (await response.json()) as { person: PersonDto; warnings?: { message: string }[] };
      const nextPeople = people.map((person) => (person.id === personId ? body.person : person));
      setPeople(nextPeople);
      pushHistory(nextPeople, relationships);
      body.warnings?.forEach((warning) => toast.warning(warning.message));
      toast.success("Person gespeichert.");
    },
    [initialData, people, pushHistory, relationships]
  );

  const saveRelationship = useCallback(
    async (relationshipId: string, payload: Partial<RelationshipDto>) => {
      const response = await fetch(apiUrl(initialData, `/relationships/${relationshipId}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        toast.error(await parseError(response));
        return;
      }
      const body = (await response.json()) as { relationship: RelationshipDto };
      const nextRelationships = relationships.map((relationship) =>
        relationship.id === relationshipId ? body.relationship : relationship
      );
      setRelationships(nextRelationships);
      pushHistory(people, nextRelationships);
      toast.success("Beziehung gespeichert.");
    },
    [initialData, people, pushHistory, relationships]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !canEdit) return;
      setEdges((current) => addEdge(connection, current));
      void createRelationship(connection.source, connection.target);
    },
    [canEdit, createRelationship, setEdges]
  );

  function onNodeDragStop(_: React.MouseEvent, node: Node) {
    if (!canEdit) return;
    const nextPeople = people.map((person) =>
      person.id === node.id ? { ...person, x: node.position.x, y: node.position.y } : person
    );
    setPeople(nextPeople);
    markDirty(nextPeople);
  }

  async function addRelative(person: PersonDto, relation: "parent" | "partner" | "child") {
    const offset = relation === "parent" ? -220 : relation === "child" ? 220 : 0;
    const side = relation === "partner" ? 280 : 0;
    const created = await addPerson({
      firstName: relation === "parent" ? "Elternteil" : relation === "child" ? "Kind" : "Partner",
      lastName: person.lastName,
      x: person.x + side,
      y: person.y + offset
    });
    if (!created) return;
    if (relation === "parent") await createRelationship(created.id, person.id, "PARENT_OF");
    if (relation === "child") await createRelationship(person.id, created.id, "PARENT_OF");
    if (relation === "partner") await createRelationship(person.id, created.id, "PARTNERSHIP");
  }

  async function duplicatePerson(person: PersonDto) {
    await addPerson({
      ...person,
      firstName: `${person.firstName} Kopie`,
      x: person.x + 260,
      y: person.y + 40
    });
  }

  function autoLayout() {
    if (!canEdit) return;
    const nextPeople = people.map((person, index) => ({
      ...person,
      x: (index % 5) * 280,
      y: Math.floor(index / 5) * 190
    }));
    setPeople(nextPeople);
    markDirty(nextPeople);
    requestAnimationFrame(() => flowInstance.current?.fitView({ padding: 0.2 }));
  }

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    const snapshot = history[nextIndex];
    setHistoryIndex(nextIndex);
    setPeople(snapshot.people);
    setRelationships(snapshot.relationships);
    setDirty(true);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const snapshot = history[nextIndex];
    setHistoryIndex(nextIndex);
    setPeople(snapshot.people);
    setRelationships(snapshot.relationships);
    setDirty(true);
  }, [history, historyIndex]);

  async function exportJson() {
    const response = await fetch(apiUrl(initialData, "/export"));
    if (!response.ok) {
      toast.error(await parseError(response));
      return;
    }
    const json = JSON.stringify(await response.json(), null, 2);
    download(`${initialData.treeName}.json`, json);
  }

  async function importJson(file: File) {
    if (!canEdit) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    const response = await fetch(apiUrl(initialData, "/import"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        people: parsed.people ?? [],
        relationships: parsed.relationships ?? []
      })
    });
    if (!response.ok) {
      toast.error(await parseError(response));
      return;
    }
    toast.success("Import abgeschlossen.");
    window.location.reload();
  }

  async function exportImage() {
    if (!flowRef.current) return;
    const dataUrl = await toPng(flowRef.current, { cacheBust: true, pixelRatio: 2 });
    const anchor = document.createElement("a");
    anchor.download = `${initialData.treeName}.png`;
    anchor.href = dataUrl;
    anchor.click();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void savePositions();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
      if (event.key === "Delete" && selectedPersonId) {
        event.preventDefault();
        void deletePerson(selectedPersonId);
      }
      if (event.key === "Delete" && selectedRelationshipId) {
        event.preventDefault();
        void deleteRelationship(selectedRelationshipId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deletePerson, deleteRelationship, redo, savePositions, selectedPersonId, selectedRelationshipId, undo]);

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden rounded-lg border bg-card">
      <EditorToolbar
        dirty={dirty}
        saving={saving}
        canEdit={canEdit}
        onSave={() => void savePositions()}
        onUndo={undo}
        onRedo={redo}
        onExportJson={() => void exportJson()}
        onImportJson={(file) => void importJson(file)}
        onExportImage={() => void exportImage()}
        onPrint={() => window.print()}
        onFit={() => flowInstance.current?.fitView({ padding: 0.2 })}
      />
      <div className="flex h-[calc(100%-49px)] flex-col lg:flex-row">
        <EditorSidebar
          canEdit={canEdit}
          query={query}
          tagFilter={tagFilter}
          relationshipType={relationshipType}
          onQueryChange={setQuery}
          onTagFilterChange={setTagFilter}
          onRelationshipTypeChange={setRelationshipType}
          onAddPerson={() => void addPerson()}
          onAutoLayout={autoLayout}
        />
        <div className="relative min-h-[520px] flex-1 bg-background" ref={flowRef}>
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              flowInstance.current = instance;
              instance.fitView({ padding: 0.2 });
            }}
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            elementsSelectable
            fitView
            onNodeClick={(_, node) => {
              setSelectedPersonId(node.id);
              setSelectedRelationshipId(null);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedRelationshipId(edge.id);
              setSelectedPersonId(null);
            }}
            onPaneClick={() => {
              setContextMenu(null);
            }}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();
              setSelectedPersonId(node.id);
              setSelectedRelationshipId(null);
              setContextMenu({ x: event.clientX, y: event.clientY, personId: node.id });
            }}
            onNodeDragStop={onNodeDragStop}
            className="editor-grid"
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable nodeColor={(node) => (node.selected ? "#56b6b6" : "#98a2b3")} />
          </ReactFlow>
          {contextMenu ? (
            <NodeContextMenu
              state={contextMenu}
              people={people}
              canEdit={canEdit}
              onClose={() => setContextMenu(null)}
              onEdit={(personId) => setSelectedPersonId(personId)}
              onAddRelative={(person, relation) => void addRelative(person, relation)}
              onDuplicate={(person) => void duplicatePerson(person)}
              onDelete={(personId) => void deletePerson(personId)}
            />
          ) : null}
        </div>
        {selectedRelationship ? (
          <RelationshipDetailPanel
            relationship={selectedRelationship}
            canEdit={canEdit}
            onSave={(id, payload) => void saveRelationship(id, payload)}
            onDelete={(id) => void deleteRelationship(id)}
          />
        ) : (
          <PersonDetailPanel
            person={selectedPerson}
            canEdit={canEdit}
            onSave={(id, payload) => void savePerson(id, payload)}
            onDelete={(id) => void deletePerson(id)}
            onAddParent={(person) => void addRelative(person, "parent")}
            onAddPartner={(person) => void addRelative(person, "partner")}
            onAddChild={(person) => void addRelative(person, "child")}
          />
        )}
      </div>
    </div>
  );
}
