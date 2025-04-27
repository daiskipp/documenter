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

export const storage = new MemStorage();
