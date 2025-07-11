import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Project table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Project relations - この関係は後で定義します

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Document table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Document relations - one-to-manyのversionは後で定義します
export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.project_id],
    references: [projects.id],
  }),
}));

export const insertDocumentSchema = createInsertSchema(documents).pick({
  project_id: true,
  title: true,
  content: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Version table for document history
export const versions = pgTable("versions", {
  id: serial("id").primaryKey(),
  document_id: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Version relations
export const versionsRelations = relations(versions, ({ one }) => ({
  document: one(documents, {
    fields: [versions.document_id],
    references: [documents.id],
  }),
}));

export const insertVersionSchema = createInsertSchema(versions).pick({
  document_id: true,
  content: true,
  created_at: true,
}).omit({ created_at: true }).extend({
  created_at: z.date().optional(),
});

export type InsertVersion = z.infer<typeof insertVersionSchema>;
export type Version = typeof versions.$inferSelect;

// すべてのテーブルを定義したら、リレーションを完成させます
export const projectsRelations = relations(projects, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelationsUpdate = relations(documents, ({ many }) => ({
  versions: many(versions),
}));

// Keep the users table as it was needed by the existing system
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
