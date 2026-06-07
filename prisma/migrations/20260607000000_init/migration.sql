CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE "Gender" AS ENUM ('UNKNOWN', 'MALE', 'FEMALE', 'DIVERSE');
CREATE TYPE "PrivacyStatus" AS ENUM ('TENANT', 'PRIVATE', 'ADMINS');
CREATE TYPE "RelationshipType" AS ENUM ('MARRIAGE', 'PARTNERSHIP', 'DIVORCED', 'ENGAGEMENT', 'PARENT_OF', 'SON_OF', 'DAUGHTER_OF', 'CHILD_OF', 'ADOPTED_CHILD', 'STEPCHILD', 'SIBLING', 'HALF_SIBLING', 'GUARDIANSHIP', 'OTHER');
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'ENDED', 'UNKNOWN');
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'TENANT_CREATED', 'FAMILY_TREE_CREATED', 'FAMILY_TREE_UPDATED', 'FAMILY_TREE_DELETED', 'PERSON_CREATED', 'PERSON_UPDATED', 'PERSON_DELETED', 'RELATIONSHIP_CREATED', 'RELATIONSHIP_UPDATED', 'RELATIONSHIP_DELETED', 'INVITATION_CREATED', 'INVITATION_ACCEPTED', 'ROLE_CHANGED', 'MEDIA_UPLOADED', 'SOURCE_CREATED', 'IMPORT_COMPLETED', 'EXPORT_COMPLETED');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'DOCUMENT', 'OTHER');
CREATE TYPE "CustomFieldEntity" AS ENUM ('PERSON', 'RELATIONSHIP');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantMembership" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "TenantRole" NOT NULL DEFAULT 'VIEWER',
  "invitedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyTree" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FamilyTree_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonNode" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "birthName" TEXT,
  "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
  "birthDate" TIMESTAMP(3),
  "birthPlace" TEXT,
  "deathDate" TIMESTAMP(3),
  "deathPlace" TEXT,
  "biography" TEXT,
  "profession" TEXT,
  "address" TEXT,
  "originPlace" TEXT,
  "profileImageUrl" TEXT,
  "privacy" "PrivacyStatus" NOT NULL DEFAULT 'TENANT',
  "tags" JSONB NOT NULL DEFAULT '[]',
  "customData" JSONB NOT NULL DEFAULT '{}',
  "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Relationship" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "sourcePersonId" TEXT NOT NULL,
  "targetPersonId" TEXT NOT NULL,
  "type" "RelationshipType" NOT NULL,
  "status" "RelationshipStatus" NOT NULL DEFAULT 'UNKNOWN',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "place" TEXT,
  "description" TEXT,
  "sourceNote" TEXT,
  "privacy" "PrivacyStatus" NOT NULL DEFAULT 'TENANT',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3),
  "place" TEXT,
  "description" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Source" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "personId" TEXT,
  "relationshipId" TEXT,
  "mediaFileId" TEXT,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "citation" TEXT,
  "url" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaFile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "treeId" TEXT,
  "personId" TEXT,
  "uploaderId" TEXT NOT NULL,
  "kind" "MediaKind" NOT NULL DEFAULT 'OTHER',
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "TenantRole" NOT NULL DEFAULT 'VIEWER',
  "tokenHash" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invitedById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomFieldDefinition" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "treeId" TEXT,
  "entity" "CustomFieldEntity" NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fieldType" TEXT NOT NULL,
  "options" JSONB NOT NULL DEFAULT '[]',
  "required" BOOLEAN NOT NULL DEFAULT false,
  "privacy" "PrivacyStatus" NOT NULL DEFAULT 'TENANT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomFieldValue" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "definitionId" TEXT NOT NULL,
  "personId" TEXT,
  "relationshipId" TEXT,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant"("deletedAt");
CREATE UNIQUE INDEX "TenantMembership_tenantId_userId_key" ON "TenantMembership"("tenantId", "userId");
CREATE INDEX "TenantMembership_tenantId_role_idx" ON "TenantMembership"("tenantId", "role");
CREATE INDEX "TenantMembership_userId_idx" ON "TenantMembership"("userId");
CREATE UNIQUE INDEX "FamilyTree_tenantId_slug_key" ON "FamilyTree"("tenantId", "slug");
CREATE INDEX "FamilyTree_tenantId_updatedAt_idx" ON "FamilyTree"("tenantId", "updatedAt");
CREATE INDEX "FamilyTree_tenantId_deletedAt_idx" ON "FamilyTree"("tenantId", "deletedAt");
CREATE INDEX "PersonNode_tenantId_treeId_idx" ON "PersonNode"("tenantId", "treeId");
CREATE INDEX "PersonNode_tenantId_lastName_idx" ON "PersonNode"("tenantId", "lastName");
CREATE INDEX "PersonNode_tenantId_birthDate_idx" ON "PersonNode"("tenantId", "birthDate");
CREATE INDEX "PersonNode_tenantId_deletedAt_idx" ON "PersonNode"("tenantId", "deletedAt");
CREATE INDEX "Relationship_tenantId_treeId_idx" ON "Relationship"("tenantId", "treeId");
CREATE INDEX "Relationship_tenantId_type_idx" ON "Relationship"("tenantId", "type");
CREATE INDEX "Relationship_sourcePersonId_idx" ON "Relationship"("sourcePersonId");
CREATE INDEX "Relationship_targetPersonId_idx" ON "Relationship"("targetPersonId");
CREATE INDEX "Relationship_tenantId_deletedAt_idx" ON "Relationship"("tenantId", "deletedAt");
CREATE INDEX "PersonEvent_tenantId_treeId_eventDate_idx" ON "PersonEvent"("tenantId", "treeId", "eventDate");
CREATE INDEX "PersonEvent_personId_idx" ON "PersonEvent"("personId");
CREATE INDEX "Source_tenantId_treeId_idx" ON "Source"("tenantId", "treeId");
CREATE INDEX "Source_personId_idx" ON "Source"("personId");
CREATE INDEX "Source_relationshipId_idx" ON "Source"("relationshipId");
CREATE INDEX "MediaFile_tenantId_treeId_idx" ON "MediaFile"("tenantId", "treeId");
CREATE INDEX "MediaFile_tenantId_personId_idx" ON "MediaFile"("tenantId", "personId");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_tenantId_email_idx" ON "Invitation"("tenantId", "email");
CREATE INDEX "Invitation_tenantId_status_idx" ON "Invitation"("tenantId", "status");
CREATE UNIQUE INDEX "CustomFieldDefinition_tenantId_treeId_key_entity_key" ON "CustomFieldDefinition"("tenantId", "treeId", "key", "entity");
CREATE INDEX "CustomFieldDefinition_tenantId_entity_idx" ON "CustomFieldDefinition"("tenantId", "entity");
CREATE INDEX "CustomFieldValue_tenantId_definitionId_idx" ON "CustomFieldValue"("tenantId", "definitionId");
CREATE INDEX "CustomFieldValue_personId_idx" ON "CustomFieldValue"("personId");
CREATE INDEX "CustomFieldValue_relationshipId_idx" ON "CustomFieldValue"("relationshipId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FamilyTree" ADD CONSTRAINT "FamilyTree_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyTree" ADD CONSTRAINT "FamilyTree_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FamilyTree" ADD CONSTRAINT "FamilyTree_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonNode" ADD CONSTRAINT "PersonNode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonNode" ADD CONSTRAINT "PersonNode_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonNode" ADD CONSTRAINT "PersonNode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonNode" ADD CONSTRAINT "PersonNode_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_sourcePersonId_fkey" FOREIGN KEY ("sourcePersonId") REFERENCES "PersonNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "PersonNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonEvent" ADD CONSTRAINT "PersonEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonEvent" ADD CONSTRAINT "PersonEvent_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonEvent" ADD CONSTRAINT "PersonEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_mediaFileId_fkey" FOREIGN KEY ("mediaFileId") REFERENCES "MediaFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
