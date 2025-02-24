--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17
-- Dumped by pg_dump version 14.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: bids_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.bids_status_enum AS ENUM (
    'DRAFT',
    'SUBMITTED'
);


ALTER TYPE public.bids_status_enum OWNER TO postgres;

--
-- Name: contracts_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contracts_status_enum AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'TERMINATED'
);


ALTER TYPE public.contracts_status_enum OWNER TO postgres;

--
-- Name: milestone_updates_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.milestone_updates_status_enum AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'DELAYED'
);


ALTER TYPE public.milestone_updates_status_enum OWNER TO postgres;

--
-- Name: milestones_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.milestones_status_enum AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'DELAYED'
);


ALTER TYPE public.milestones_status_enum OWNER TO postgres;

--
-- Name: rfps_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rfps_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'CLOSED'
);


ALTER TYPE public.rfps_status_enum OWNER TO postgres;

--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'GPO',
    'VENDOR'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "rfpId" uuid NOT NULL,
    "vendorId" uuid NOT NULL,
    "proposalDocument" character varying NOT NULL,
    status public.bids_status_enum DEFAULT 'DRAFT'::public.bids_status_enum NOT NULL,
    "aiCheckPerformed" boolean DEFAULT false NOT NULL,
    "aiSuggestions" text,
    "submissionDate" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "evaluationScore" numeric(5,2),
    "shortEvaluation" text,
    "longEvaluation" text,
    "evaluationDetails" jsonb,
    "evaluationDate" timestamp without time zone,
    "submissionTxUrl" text,
    "evaluationTxUrl" text
);


ALTER TABLE public.bids OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "rfpId" uuid NOT NULL,
    "vendorId" uuid NOT NULL,
    "bidId" uuid NOT NULL,
    status public.contracts_status_enum DEFAULT 'ACTIVE'::public.contracts_status_enum NOT NULL,
    "awardDate" timestamp without time zone NOT NULL,
    "startDate" timestamp without time zone NOT NULL,
    "endDate" timestamp without time zone NOT NULL,
    "totalValue" numeric(10,2) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: milestone_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.milestone_updates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "milestoneId" uuid NOT NULL,
    "contractId" uuid NOT NULL,
    status public.milestone_updates_status_enum NOT NULL,
    details text NOT NULL,
    media text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedById" uuid NOT NULL
);


ALTER TABLE public.milestone_updates OWNER TO postgres;

--
-- Name: milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.milestones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    "dueDate" timestamp without time zone NOT NULL,
    status public.milestones_status_enum DEFAULT 'NOT_STARTED'::public.milestones_status_enum NOT NULL,
    "contractId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.milestones OWNER TO postgres;

--
-- Name: rfp_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfp_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rfp_categories OWNER TO postgres;

--
-- Name: rfps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    "shortDescription" text NOT NULL,
    "longDescription" text NOT NULL,
    "timelineStartDate" timestamp without time zone NOT NULL,
    "timelineEndDate" timestamp without time zone NOT NULL,
    budget numeric(10,2) NOT NULL,
    "issueDate" timestamp without time zone NOT NULL,
    "submissionDeadline" timestamp without time zone NOT NULL,
    "categoryId" uuid NOT NULL,
    status public.rfps_status_enum DEFAULT 'DRAFT'::public.rfps_status_enum NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "createdById" uuid NOT NULL,
    "awardedContractId" uuid,
    "awardedVendorId" uuid,
    "awardedDate" timestamp without time zone,
    "creationTxUrl" text,
    "publicationTxUrl" text
);


ALTER TABLE public.rfps OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role public.users_role_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "businessName" character varying,
    "businessRegistrationNumber" character varying,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationToken" character varying,
    "verificationTokenExpiry" timestamp without time zone,
    "businessEmail" character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: bids; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bids (id, "rfpId", "vendorId", "proposalDocument", status, "aiCheckPerformed", "aiSuggestions", "submissionDate", "createdAt", "updatedAt", "evaluationScore", "shortEvaluation", "longEvaluation", "evaluationDetails", "evaluationDate", "submissionTxUrl", "evaluationTxUrl") FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, "rfpId", "vendorId", "bidId", status, "awardDate", "startDate", "endDate", "totalValue", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1738063289136	AddBlockchainTxUrlsToRfp1738063289136
\.


--
-- Data for Name: milestone_updates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.milestone_updates (id, "milestoneId", "contractId", status, details, media, "createdAt", "updatedAt", "updatedById") FROM stdin;
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.milestones (id, title, description, "dueDate", status, "contractId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: rfp_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfp_categories (id, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: rfps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfps (id, title, "shortDescription", "longDescription", "timelineStartDate", "timelineEndDate", budget, "issueDate", "submissionDeadline", "categoryId", status, "isPublished", "createdAt", "updatedAt", "createdById", "awardedContractId", "awardedVendorId", "awardedDate", "creationTxUrl", "publicationTxUrl") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, "createdAt", "updatedAt", "businessName", "businessRegistrationNumber", "isVerified", "verificationToken", "verificationTokenExpiry", "businessEmail") FROM stdin;
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, true);


--
-- Name: milestones PK_0bdbfe399c777a6a8520ff902d9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT "PK_0bdbfe399c777a6a8520ff902d9" PRIMARY KEY (id);


--
-- Name: contracts PK_2c7b8f3a7b1acdd49497d83d0fb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY (id);


--
-- Name: rfp_categories PK_44d57258299ba27a347562ebdce; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfp_categories
    ADD CONSTRAINT "PK_44d57258299ba27a347562ebdce" PRIMARY KEY (id);


--
-- Name: milestone_updates PK_5bdb25e7fdcc82b341827bc115b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestone_updates
    ADD CONSTRAINT "PK_5bdb25e7fdcc82b341827bc115b" PRIMARY KEY (id);


--
-- Name: rfps PK_77f2177bb7367550c946f8ef0c8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps
    ADD CONSTRAINT "PK_77f2177bb7367550c946f8ef0c8" PRIMARY KEY (id);


--
-- Name: bids PK_7950d066d322aab3a488ac39fe5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT "PK_7950d066d322aab3a488ac39fe5" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: rfp_categories UQ_9f0d27b29f8f9c394e267d86ba5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfp_categories
    ADD CONSTRAINT "UQ_9f0d27b29f8f9c394e267d86ba5" UNIQUE (name);


--
-- Name: contracts FK_2bacffbaf8cdac1c2f4372a286e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "FK_2bacffbaf8cdac1c2f4372a286e" FOREIGN KEY ("rfpId") REFERENCES public.rfps(id);


--
-- Name: bids FK_3fc39feeb36f0b031c90c73003c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT "FK_3fc39feeb36f0b031c90c73003c" FOREIGN KEY ("vendorId") REFERENCES public.users(id);


--
-- Name: contracts FK_5b25d57839e5465600cbb144f48; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "FK_5b25d57839e5465600cbb144f48" FOREIGN KEY ("vendorId") REFERENCES public.users(id);


--
-- Name: contracts FK_5c3066bc3ec3f547c4ab0ae04b3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "FK_5c3066bc3ec3f547c4ab0ae04b3" FOREIGN KEY ("bidId") REFERENCES public.bids(id);


--
-- Name: milestone_updates FK_7aebe522b5b735ccd8414c9e6b7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestone_updates
    ADD CONSTRAINT "FK_7aebe522b5b735ccd8414c9e6b7" FOREIGN KEY ("milestoneId") REFERENCES public.milestones(id);


--
-- Name: milestone_updates FK_7c73136529cb3df4a7042761c3a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestone_updates
    ADD CONSTRAINT "FK_7c73136529cb3df4a7042761c3a" FOREIGN KEY ("contractId") REFERENCES public.contracts(id);


--
-- Name: rfps FK_7ed0c84fcc5c0d880359f4b5959; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps
    ADD CONSTRAINT "FK_7ed0c84fcc5c0d880359f4b5959" FOREIGN KEY ("createdById") REFERENCES public.users(id);


--
-- Name: milestone_updates FK_9014c95c55f2eeac4007f398598; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestone_updates
    ADD CONSTRAINT "FK_9014c95c55f2eeac4007f398598" FOREIGN KEY ("updatedById") REFERENCES public.users(id);


--
-- Name: rfps FK_b5bed400c9a9a11f04cdffb0c1d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps
    ADD CONSTRAINT "FK_b5bed400c9a9a11f04cdffb0c1d" FOREIGN KEY ("awardedVendorId") REFERENCES public.users(id);


--
-- Name: milestones FK_b6d0284fa612b38d1f7910cfff2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT "FK_b6d0284fa612b38d1f7910cfff2" FOREIGN KEY ("contractId") REFERENCES public.contracts(id);


--
-- Name: rfps FK_d9d8d8c6f13dbdceaee0a81ebc0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps
    ADD CONSTRAINT "FK_d9d8d8c6f13dbdceaee0a81ebc0" FOREIGN KEY ("categoryId") REFERENCES public.rfp_categories(id);


--
-- Name: rfps FK_e646fa8cfb276fef5883a18b101; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps
    ADD CONSTRAINT "FK_e646fa8cfb276fef5883a18b101" FOREIGN KEY ("awardedContractId") REFERENCES public.contracts(id);


--
-- Name: bids FK_f1984b1eaacbd832c4905b13499; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT "FK_f1984b1eaacbd832c4905b13499" FOREIGN KEY ("rfpId") REFERENCES public.rfps(id);


--
-- PostgreSQL database dump complete
--

