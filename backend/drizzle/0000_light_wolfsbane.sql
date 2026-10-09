CREATE TYPE "public"."cible_signalement" AS ENUM('fil', 'reponse', 'message', 'parrainage');--> statement-breakpoint
CREATE TYPE "public"."origine_parrainage" AS ENUM('stagiaire_demande', 'pro_invite');--> statement-breakpoint
CREATE TYPE "public"."qualificatif" AS ENUM('autonomie', 'rigueur', 'curiosite', 'fiabilite', 'methode', 'tenacite', 'creativite', 'initiative');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('membre', 'pro');--> statement-breakpoint
CREATE TYPE "public"."statut_parrainage" AS ENUM('attente_pro', 'attente_validation', 'attente_acceptation', 'acceptee', 'refusee', 'expiree');--> statement-breakpoint
CREATE TABLE "abonnement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personne_id" uuid NOT NULL,
	"debut" date NOT NULL,
	"fin" date NOT NULL,
	CONSTRAINT "abonnement_fin_apres_debut" CHECK ("abonnement"."fin" > "abonnement"."debut")
);
--> statement-breakpoint
CREATE TABLE "abonnement_forum" (
	"personne_id" uuid NOT NULL,
	"forum_id" uuid NOT NULL,
	CONSTRAINT "abonnement_forum_personne_id_forum_id_pk" PRIMARY KEY("personne_id","forum_id")
);
--> statement-breakpoint
CREATE TABLE "blocage" (
	"bloqueur_id" uuid NOT NULL,
	"bloque_id" uuid NOT NULL,
	CONSTRAINT "blocage_bloqueur_id_bloque_id_pk" PRIMARY KEY("bloqueur_id","bloque_id"),
	CONSTRAINT "blocage_pas_soi_meme" CHECK ("blocage"."bloqueur_id" <> "blocage"."bloque_id")
);
--> statement-breakpoint
CREATE TABLE "candidature" (
	"offre_id" uuid NOT NULL,
	"personne_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lu_at" timestamp with time zone,
	CONSTRAINT "candidature_offre_id_personne_id_pk" PRIMARY KEY("offre_id","personne_id")
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"a_id" uuid,
	"b_id" uuid,
	"dernier_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_paire_ordonnee" CHECK ("conversation"."a_id" < "conversation"."b_id")
);
--> statement-breakpoint
CREATE TABLE "entreprise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"secteur" text NOT NULL,
	"domaine_email" text,
	CONSTRAINT "entreprise_nom_unique" UNIQUE("nom"),
	CONSTRAINT "entreprise_domaineEmail_unique" UNIQUE("domaine_email")
);
--> statement-breakpoint
CREATE TABLE "evenement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"lieu" text NOT NULL,
	"debut" timestamp with time zone NOT NULL,
	"capacite" integer NOT NULL,
	"ouverture_inscriptions" timestamp with time zone NOT NULL,
	CONSTRAINT "evenement_capacite" CHECK ("evenement"."capacite" > 0)
);
--> statement-breakpoint
CREATE TABLE "experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personne_id" uuid NOT NULL,
	"entreprise_id" uuid NOT NULL,
	"intitule" text NOT NULL,
	"debut" date NOT NULL,
	"fin" date,
	CONSTRAINT "experience_fin_apres_debut" CHECK ("experience"."fin" IS NULL OR "experience"."fin" >= "experience"."debut")
);
--> statement-breakpoint
CREATE TABLE "fil" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum_id" uuid NOT NULL,
	"auteur_id" uuid,
	"titre" text NOT NULL,
	"corps" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"rang" double precision GENERATED ALWAYS AS (sign(score) * log(greatest(abs(score), 1)) + extract(epoch FROM (created_at AT TIME ZONE 'UTC')) / 1209600) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"libelle" text NOT NULL,
	CONSTRAINT "forum_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "inscription" (
	"evenement_id" uuid NOT NULL,
	"personne_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inscription_evenement_id_personne_id_pk" PRIMARY KEY("evenement_id","personne_id")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"expediteur_id" uuid,
	"corps" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lu_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "offre" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pro_id" uuid NOT NULL,
	"entreprise_id" uuid NOT NULL,
	"intitule" text NOT NULL,
	"lieu" text NOT NULL,
	"duree_mois" integer NOT NULL,
	"publiee_le" timestamp with time zone DEFAULT now() NOT NULL,
	"cloturee_le" timestamp with time zone,
	CONSTRAINT "offre_duree_mois" CHECK ("offre"."duree_mois" > 0)
);
--> statement-breakpoint
CREATE TABLE "parrainage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parrain_id" uuid,
	"filleul_id" uuid,
	"parrain_nom" text NOT NULL,
	"parrain_email" text NOT NULL,
	"filleul_nom" text NOT NULL,
	"filleul_email" text NOT NULL,
	"qualificatif" "qualificatif",
	"commentaire" text,
	"statut" "statut_parrainage" NOT NULL,
	"origine" "origine_parrainage" NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parrainage_rempli_si_avance" CHECK ("parrainage"."statut" = 'attente_pro' OR ("parrainage"."qualificatif" IS NOT NULL AND "parrainage"."commentaire" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "personne" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"prenom" text NOT NULL,
	"role" "role" NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"accord" text,
	"description" text DEFAULT '' NOT NULL,
	"en_recherche" boolean DEFAULT false NOT NULL,
	"cherche" text,
	"dispo" text,
	"cv_chemin" text,
	"auth_user_id" uuid,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personne_authUserId_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "personne_stripeCustomerId_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "reponse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fil_id" uuid NOT NULL,
	"auteur_id" uuid,
	"corps" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signalement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auteur_id" uuid,
	"cible_type" "cible_signalement" NOT NULL,
	"cible_id" uuid NOT NULL,
	"motif" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"traite_le" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"personne_id" uuid NOT NULL,
	"fil_id" uuid NOT NULL,
	"valeur" integer NOT NULL,
	CONSTRAINT "vote_personne_id_fil_id_pk" PRIMARY KEY("personne_id","fil_id"),
	CONSTRAINT "vote_valeur" CHECK ("vote"."valeur" IN (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "abonnement" ADD CONSTRAINT "abonnement_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abonnement_forum" ADD CONSTRAINT "abonnement_forum_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abonnement_forum" ADD CONSTRAINT "abonnement_forum_forum_id_forum_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocage" ADD CONSTRAINT "blocage_bloqueur_id_personne_id_fk" FOREIGN KEY ("bloqueur_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocage" ADD CONSTRAINT "blocage_bloque_id_personne_id_fk" FOREIGN KEY ("bloque_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidature" ADD CONSTRAINT "candidature_offre_id_offre_id_fk" FOREIGN KEY ("offre_id") REFERENCES "public"."offre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidature" ADD CONSTRAINT "candidature_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_a_id_personne_id_fk" FOREIGN KEY ("a_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_b_id_personne_id_fk" FOREIGN KEY ("b_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_entreprise_id_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fil" ADD CONSTRAINT "fil_forum_id_forum_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forum"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fil" ADD CONSTRAINT "fil_auteur_id_personne_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_evenement_id_evenement_id_fk" FOREIGN KEY ("evenement_id") REFERENCES "public"."evenement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_expediteur_id_personne_id_fk" FOREIGN KEY ("expediteur_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offre" ADD CONSTRAINT "offre_pro_id_personne_id_fk" FOREIGN KEY ("pro_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offre" ADD CONSTRAINT "offre_entreprise_id_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parrainage" ADD CONSTRAINT "parrainage_parrain_id_personne_id_fk" FOREIGN KEY ("parrain_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parrainage" ADD CONSTRAINT "parrainage_filleul_id_personne_id_fk" FOREIGN KEY ("filleul_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reponse" ADD CONSTRAINT "reponse_fil_id_fil_id_fk" FOREIGN KEY ("fil_id") REFERENCES "public"."fil"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reponse" ADD CONSTRAINT "reponse_auteur_id_personne_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signalement" ADD CONSTRAINT "signalement_auteur_id_personne_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."personne"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_fil_id_fil_id_fk" FOREIGN KEY ("fil_id") REFERENCES "public"."fil"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "abonnement_personne_idx" ON "abonnement" USING btree ("personne_id","fin");--> statement-breakpoint
CREATE INDEX "abonnement_forum_forum_idx" ON "abonnement_forum" USING btree ("forum_id");--> statement-breakpoint
CREATE INDEX "blocage_bloque_idx" ON "blocage" USING btree ("bloque_id");--> statement-breakpoint
CREATE INDEX "candidature_personne_idx" ON "candidature" USING btree ("personne_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_paire_idx" ON "conversation" USING btree ("a_id","b_id");--> statement-breakpoint
CREATE INDEX "conversation_b_idx" ON "conversation" USING btree ("b_id");--> statement-breakpoint
CREATE INDEX "experience_personne_idx" ON "experience" USING btree ("personne_id");--> statement-breakpoint
CREATE INDEX "experience_entreprise_idx" ON "experience" USING btree ("entreprise_id");--> statement-breakpoint
CREATE INDEX "fil_populaire_idx" ON "fil" USING btree ("forum_id","rang" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "fil_recent_idx" ON "fil" USING btree ("forum_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "fil_auteur_idx" ON "fil" USING btree ("auteur_id");--> statement-breakpoint
CREATE INDEX "inscription_ordre_idx" ON "inscription" USING btree ("evenement_id","created_at");--> statement-breakpoint
CREATE INDEX "inscription_personne_idx" ON "inscription" USING btree ("personne_id");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "message_expediteur_idx" ON "message" USING btree ("expediteur_id");--> statement-breakpoint
CREATE INDEX "offre_pro_idx" ON "offre" USING btree ("pro_id");--> statement-breakpoint
CREATE INDEX "offre_entreprise_idx" ON "offre" USING btree ("entreprise_id");--> statement-breakpoint
CREATE INDEX "parrainage_filleul_idx" ON "parrainage" USING btree ("filleul_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "parrainage_parrain_idx" ON "parrainage" USING btree ("parrain_id");--> statement-breakpoint
CREATE INDEX "personne_deck_idx" ON "personne" USING btree ("role","en_recherche");--> statement-breakpoint
CREATE INDEX "reponse_fil_idx" ON "reponse" USING btree ("fil_id","created_at");--> statement-breakpoint
CREATE INDEX "reponse_auteur_idx" ON "reponse" USING btree ("auteur_id");--> statement-breakpoint
CREATE INDEX "signalement_a_traiter_idx" ON "signalement" USING btree ("created_at") WHERE "signalement"."traite_le" IS NULL;--> statement-breakpoint
CREATE INDEX "vote_fil_idx" ON "vote" USING btree ("fil_id");--> statement-breakpoint
CREATE VIEW "public"."inscription_rang" AS (
  SELECT r.evenement_id, r.personne_id, r.created_at, r.rang, r.rang > e.capacite AS en_attente
  FROM (
    SELECT evenement_id, personne_id, created_at,
           (row_number() OVER (PARTITION BY evenement_id ORDER BY created_at, personne_id))::int AS rang
    FROM inscription
  ) r
  JOIN evenement e ON e.id = r.evenement_id
);