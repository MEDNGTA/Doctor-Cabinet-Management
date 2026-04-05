CREATE TABLE "doctor_team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_team_members" ADD CONSTRAINT "doctor_team_members_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_team_members" ADD CONSTRAINT "doctor_team_members_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_doctor_idx" ON "doctor_team_members" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "team_staff_idx" ON "doctor_team_members" USING btree ("staff_id");