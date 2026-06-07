import { AuditAction, PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/server/security/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.deleteMany({ where: { slug: "demo-familie" } });

  const demoPassword = "DemoPasswort123";
  const ownerPasswordHash = await hashPassword(demoPassword);
  const editorPasswordHash = await hashPassword(demoPassword);
  const viewerPasswordHash = await hashPassword(demoPassword);

  const owner = await prisma.user.upsert({
    where: { email: "owner.demo@example.test" },
    update: { emailVerified: new Date(), passwordHash: ownerPasswordHash },
    create: {
      email: "owner.demo@example.test",
      name: "Demo Owner",
      emailVerified: new Date(),
      passwordHash: ownerPasswordHash
    }
  });
  const editor = await prisma.user.upsert({
    where: { email: "editor.demo@example.test" },
    update: { emailVerified: new Date(), passwordHash: editorPasswordHash },
    create: {
      email: "editor.demo@example.test",
      name: "Demo Editor",
      emailVerified: new Date(),
      passwordHash: editorPasswordHash
    }
  });
  const viewer = await prisma.user.upsert({
    where: { email: "viewer.demo@example.test" },
    update: { emailVerified: new Date(), passwordHash: viewerPasswordHash },
    create: {
      email: "viewer.demo@example.test",
      name: "Demo Viewer",
      emailVerified: new Date(),
      passwordHash: viewerPasswordHash
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Familie",
      slug: "demo-familie",
      description: "Fiktive Beispielgruppe für lokale Entwicklung.",
      memberships: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: editor.id, role: "EDITOR", invitedById: owner.id },
          { userId: viewer.id, role: "VIEWER", invitedById: owner.id }
        ]
      }
    }
  });

  const tree = await prisma.familyTree.create({
    data: {
      tenantId: tenant.id,
      name: "Chronik der Familie Morgenstern",
      slug: "chronik-morgenstern",
      description: "Fiktiver Stammbaum mit drei Generationen, Quellen und verschiedenen Beziehungen.",
      createdById: owner.id,
      updatedById: owner.id
    }
  });

  const people = await Promise.all([
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Clara",
        lastName: "Morgenstern",
        birthName: "Weber",
        gender: "FEMALE",
        birthDate: new Date("1938-04-12"),
        birthPlace: "Graz",
        biography: "Fiktive Archivarin mit besonderem Interesse an Ortschroniken.",
        profession: "Archivarin",
        originPlace: "Steiermark",
        tags: ["Generation 1", "Morgenstern"],
        x: 0,
        y: 0,
        createdById: owner.id,
        updatedById: owner.id
      }
    }),
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Johann",
        lastName: "Morgenstern",
        gender: "MALE",
        birthDate: new Date("1935-09-21"),
        birthPlace: "Leoben",
        deathDate: new Date("2018-02-05"),
        deathPlace: "Wien",
        profession: "Tischler",
        tags: ["Generation 1", "Morgenstern"],
        x: 280,
        y: 0,
        createdById: owner.id,
        updatedById: owner.id
      }
    }),
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Eva",
        lastName: "Morgenstern",
        gender: "FEMALE",
        birthDate: new Date("1964-06-03"),
        birthPlace: "Wien",
        profession: "Lehrerin",
        tags: ["Generation 2"],
        x: 120,
        y: 220,
        createdById: owner.id,
        updatedById: owner.id
      }
    }),
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Lukas",
        lastName: "Morgenstern",
        gender: "MALE",
        birthDate: new Date("1968-11-19"),
        birthPlace: "Wien",
        profession: "Fotograf",
        privacy: "ADMINS",
        tags: ["Generation 2"],
        x: 420,
        y: 220,
        createdById: owner.id,
        updatedById: owner.id
      }
    }),
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Mira",
        lastName: "Keller",
        gender: "FEMALE",
        birthDate: new Date("1970-01-08"),
        birthPlace: "Salzburg",
        profession: "Ärztin",
        tags: ["Keller"],
        x: 700,
        y: 220,
        createdById: editor.id,
        updatedById: editor.id
      }
    }),
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Noah",
        lastName: "Morgenstern",
        gender: "MALE",
        birthDate: new Date("1994-03-14"),
        birthPlace: "Wien",
        profession: "Designer",
        tags: ["Generation 3"],
        x: 320,
        y: 460,
        createdById: editor.id,
        updatedById: editor.id
      }
    }),
    prisma.personNode.create({
      data: {
        tenantId: tenant.id,
        treeId: tree.id,
        firstName: "Lea",
        lastName: "Morgenstern",
        gender: "FEMALE",
        birthDate: new Date("1997-08-27"),
        birthPlace: "Wien",
        tags: ["Generation 3"],
        x: 610,
        y: 460,
        createdById: editor.id,
        updatedById: editor.id
      }
    })
  ]);

  const [clara, johann, eva, lukas, mira, noah, lea] = people;

  await prisma.relationship.createMany({
    data: [
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: clara.id,
        targetPersonId: johann.id,
        type: "MARRIAGE",
        status: "ACTIVE",
        startDate: new Date("1959-05-16"),
        place: "Graz",
        createdById: owner.id,
        updatedById: owner.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: clara.id,
        targetPersonId: eva.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: owner.id,
        updatedById: owner.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: johann.id,
        targetPersonId: eva.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: owner.id,
        updatedById: owner.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: clara.id,
        targetPersonId: lukas.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: owner.id,
        updatedById: owner.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: johann.id,
        targetPersonId: lukas.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: owner.id,
        updatedById: owner.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: lukas.id,
        targetPersonId: mira.id,
        type: "PARTNERSHIP",
        status: "ACTIVE",
        startDate: new Date("1992-09-01"),
        place: "Wien",
        createdById: editor.id,
        updatedById: editor.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: lukas.id,
        targetPersonId: noah.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: editor.id,
        updatedById: editor.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: mira.id,
        targetPersonId: noah.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: editor.id,
        updatedById: editor.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: lukas.id,
        targetPersonId: lea.id,
        type: "PARENT_OF",
        status: "ACTIVE",
        createdById: editor.id,
        updatedById: editor.id
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        sourcePersonId: noah.id,
        targetPersonId: lea.id,
        type: "SIBLING",
        status: "ACTIVE",
        createdById: editor.id,
        updatedById: editor.id
      }
    ]
  });

  const media = await prisma.mediaFile.create({
    data: {
      tenantId: tenant.id,
      treeId: tree.id,
      personId: clara.id,
      uploaderId: owner.id,
      kind: "IMAGE",
      filename: "demo-archivfoto.jpg",
      contentType: "image/jpeg",
      size: 142_000,
      storageKey: "demo/demo-archivfoto.jpg",
      checksum: "demo-checksum"
    }
  });

  await prisma.source.createMany({
    data: [
      {
        tenantId: tenant.id,
        treeId: tree.id,
        personId: clara.id,
        title: "Fiktiver Geburtseintrag Clara Weber",
        type: "Archivnotiz",
        citation: "Demo-Archiv, Bestand A, Nr. 12",
        notes: "Reine Testquelle ohne echte personenbezogene Daten."
      },
      {
        tenantId: tenant.id,
        treeId: tree.id,
        mediaFileId: media.id,
        title: "Fiktives Familienfoto",
        type: "Bild",
        citation: "Generisches Demo-Medium"
      }
    ]
  });

  await prisma.customFieldDefinition.create({
    data: {
      tenantId: tenant.id,
      treeId: tree.id,
      entity: "PERSON",
      key: "archiveSignature",
      label: "Archivsignatur",
      fieldType: "text"
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        actorId: owner.id,
        action: AuditAction.TENANT_CREATED,
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: { seed: true }
      },
      {
        tenantId: tenant.id,
        actorId: owner.id,
        action: AuditAction.FAMILY_TREE_CREATED,
        entityType: "FamilyTree",
        entityId: tree.id,
        metadata: { seed: true }
      },
      {
        tenantId: tenant.id,
        actorId: editor.id,
        action: AuditAction.MEDIA_UPLOADED,
        entityType: "MediaFile",
        entityId: media.id,
        metadata: { seed: true }
      }
    ]
  });

  console.log(`Seed abgeschlossen: Tenant ${tenant.name} (${tenant.id}), Stammbaum ${tree.id}`);
  console.log(`Demo-Login: owner.demo@example.test / ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
