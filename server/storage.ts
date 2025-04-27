import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  documents, type Document, type InsertDocument,
  versions, type Version, type InsertVersion
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Document operations
  getDocuments(projectId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Version operations
  getVersions(documentId: number): Promise<Version[]>;
  getVersion(id: number): Promise<Version | undefined>;
  createVersion(version: InsertVersion): Promise<Version>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private documents: Map<number, Document>;
  private versions: Map<number, Version>;
  private currentId: { user: number; project: number; document: number; version: number };

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.documents = new Map();
    this.versions = new Map();
    this.currentId = { user: 1, project: 1, document: 1, version: 1 };
  }

  // User operations (kept from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentId.project++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      created_at: now, 
      updated_at: now 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;

    const updatedProject: Project = {
      ...existingProject,
      ...project,
      updated_at: new Date()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Delete associated documents and versions
    const documents = await this.getDocuments(id);
    for (const doc of documents) {
      await this.deleteDocument(doc.id);
    }

    return this.projects.delete(id);
  }

  // Document operations
  async getDocuments(projectId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.project_id === projectId
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId.document++;
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      id,
      created_at: now,
      updated_at: now
    };
    this.documents.set(id, document);

    // If the document has content, create initial version
    if (document.content) {
      await this.createVersion({
        document_id: document.id,
        content: document.content
      });
    }

    return document;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) return undefined;

    const updatedDocument: Document = {
      ...existingDocument,
      ...document,
      updated_at: new Date()
    };
    this.documents.set(id, updatedDocument);

    // Create a new version if content is updated
    if (document.content !== undefined) {
      await this.createVersion({
        document_id: id,
        content: document.content
      });
    }

    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Delete associated versions
    const versions = await this.getVersions(id);
    for (const version of versions) {
      this.versions.delete(version.id);
    }

    return this.documents.delete(id);
  }

  // Version operations
  async getVersions(documentId: number): Promise<Version[]> {
    return Array.from(this.versions.values())
      .filter((version) => version.document_id === documentId)
      .sort((a, b) => {
        // Sort by creation date, newest first
        return (new Date(b.created_at)).getTime() - (new Date(a.created_at)).getTime();
      });
  }

  async getVersion(id: number): Promise<Version | undefined> {
    return this.versions.get(id);
  }

  async createVersion(insertVersion: InsertVersion): Promise<Version> {
    const id = this.currentId.version++;
    const version: Version = {
      ...insertVersion,
      id,
      created_at: new Date()
    };
    this.versions.set(id, version);
    return version;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.updated_at));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const now = new Date();
    const [project] = await db.insert(projects).values({
      ...insertProject,
      created_at: now,
      updated_at: now
    }).returning();
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<boolean> {
    // First get all documents for this project
    const projectDocuments = await db.select().from(documents).where(eq(documents.project_id, id));
    
    // Delete all versions associated with these documents
    for (const doc of projectDocuments) {
      await db.delete(versions).where(eq(versions.document_id, doc.id));
    }
    
    // Delete all documents
    await db.delete(documents).where(eq(documents.project_id, id));
    
    // Delete the project
    const deleted = await db.delete(projects).where(eq(projects.id, id)).returning();
    return deleted.length > 0;
  }

  // Document operations
  async getDocuments(projectId: number): Promise<Document[]> {
    return await db.select()
      .from(documents)
      .where(eq(documents.project_id, projectId))
      .orderBy(desc(documents.updated_at));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const now = new Date();
    // content フィールドの処理を明示的に行う
    const contentValue = insertDocument.content === undefined ? null : insertDocument.content;
    
    const [document] = await db.insert(documents).values({
      ...insertDocument,
      content: contentValue,
      created_at: now,
      updated_at: now
    }).returning();
    
    // If the document has content, create initial version
    if (document.content) {
      await this.createVersion({
        document_id: document.id,
        content: document.content
      });
    }
    
    return document;
  }

  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    try {
      console.log("[DEBUG] Storage: updateDocument called with id:", id, "updateData:", updateData);
      
      // First get the current document to create a version
      const [existingDocument] = await db.select().from(documents).where(eq(documents.id, id));
      
      if (!existingDocument) {
        console.log("[DEBUG] Document not found with id:", id);
        return undefined;
      }
      
      console.log("[DEBUG] Existing document:", existingDocument);
      
      // コンテンツが変更される場合は必ず既存のコンテンツでバージョンを作成
      if (updateData.content !== undefined && existingDocument.content) {
        console.log("[DEBUG] Creating version with content length:", (existingDocument.content || "").length);
        
        // バージョンを作成（常に既存のコンテンツを保存）
        await this.createVersion({
          document_id: id,
          content: existingDocument.content
        });
        
        // バージョンを作成できたか確認
        const versions = await this.getVersions(id);
        console.log("[DEBUG] Versions after creation:", versions.length, "newest:", versions[0]?.id);
      } else {
        console.log("[DEBUG] Skipping version creation - no content change or null content");
      }
      
      // Make sure content is properly handled for null values
      const contentToUpdate = updateData.content === undefined ? 
        undefined : 
        (updateData.content === null ? null : updateData.content);
      
      // Update the document with fixed content handling
      const [updatedDocument] = await db.update(documents)
        .set({
          ...updateData,
          content: contentToUpdate,
          updated_at: new Date()
        })
        .where(eq(documents.id, id))
        .returning();
      
      console.log("[DEBUG] Updated document:", updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error("[ERROR] Failed to update document:", error);
      throw error;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Delete all versions
    await db.delete(versions).where(eq(versions.document_id, id));
    
    // Delete the document
    const deleted = await db.delete(documents).where(eq(documents.id, id)).returning();
    return deleted.length > 0;
  }

  // Version operations
  async getVersions(documentId: number): Promise<Version[]> {
    return await db.select()
      .from(versions)
      .where(eq(versions.document_id, documentId))
      .orderBy(desc(versions.created_at));
  }

  async getVersion(id: number): Promise<Version | undefined> {
    const [version] = await db.select().from(versions).where(eq(versions.id, id));
    return version;
  }

  async createVersion(insertVersion: InsertVersion): Promise<Version> {
    const now = new Date();
    const [version] = await db.insert(versions).values({
      ...insertVersion,
      created_at: now
    }).returning();
    return version;
  }
}

// Import the needed functions from drizzle-orm
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
