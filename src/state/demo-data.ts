import { displayNumber, makeNumberingPath } from "@/domain/numbering"
import type {
  AiSuggestion,
  AiSuggestionTarget,
  AppendixField,
  AppendixRecord,
  AppendixRecordValue,
  AppendixTable,
  AppendixTableType,
  Asset,
  ContentBlock,
  ContentBlockVersion,
  ContentBlockType,
  ContentTextAnchor,
  Course,
  CourseMetrics,
  CourseNode,
  DifficultyLevel,
  EntityLink,
  Flashcard,
  FlashcardSource,
  FlashcardType,
  Language,
  ReviewAttempt,
  ReviewSession,
  Source,
  StudyData,
  StudySchedule,
  Tag,
  Tagging,
} from "@/domain/types"

const profileId = "profile_demo"
const now = "2026-05-03T09:00:00.000Z"
const demoToday = new Date("2026-05-03T12:00:00.000Z")

const duePast = "2026-05-02T09:00:00.000Z"
const dueOld = "2026-04-28T09:00:00.000Z"
const dueToday = "2026-05-03T08:00:00.000Z"
const dueTomorrow = "2026-05-04T09:00:00.000Z"
const dueFuture = "2026-05-14T09:00:00.000Z"

type TableSeed = {
  slug: string
  name: string
  tableType: AppendixTableType
  description: string
}

type SourceSeed = {
  suffix: string
  sourceType: string
  title: string
  author?: string
  citation?: string
  url?: string
  publisher?: string
  publishedDate?: string
  pageStart?: string
  pageEnd?: string
}

type AssetSeed = {
  suffix: string
  fileName: string
  mimeType: string
  assetType: Asset["assetType"]
  bucket: string
  storagePath: string
  fileSizeBytes: number
  sourceSuffix?: string
}

type RecordSeed = {
  suffix: string
  tableSlug: string
  title: string
  recordType: string
  description: string
  sourceSuffix?: string
  language?: Language
  aliases?: string[]
  translations?: Partial<Record<Language, string[]>>
  tags?: string[]
  method?: AppendixRecord["createdMethod"]
}

type SpecialBlockSeed = {
  type: ContentBlockType
  text: string
  formula?: string
  rows?: string[][]
  assetSuffix?: string
}

type SubsectionSeed = {
  suffix: string
  title: string
  topic: string
  term: string
  paragraph: string
  definition: string
  example: string
  question: string
  summary: string
  special: SpecialBlockSeed
  language?: Language
  primaryRecordSuffix?: string
}

type ModuleSeed = {
  title: string
  chapter: string
  sections: Array<{
    title: string
    subsection: SubsectionSeed
  }>
}

type CourseSeed = {
  key: string
  id: string
  title: string
  description: string
  mainLanguage: Language
  subject: string
  difficultyLevel: DifficultyLevel
  status: Course["status"]
  examDate?: string
  targetDate?: string
  sourceType: string
  estimatedStudyMinutes: number
  masteryScore: number
  confidenceScore: number
  tags: string[]
  customTables: TableSeed[]
  sources: SourceSeed[]
  assets: AssetSeed[]
  records: RecordSeed[]
  modules: ModuleSeed[]
  anchors: Array<{ blockSuffix: string; recordSuffix: string; selectedText: string; linkType: string }>
}

type CourseBundle = {
  course: Course
  nodes: CourseNode[]
  blocks: ContentBlock[]
  anchors: ContentTextAnchor[]
  tables: AppendixTable[]
  fields: AppendixField[]
  records: AppendixRecord[]
  values: AppendixRecordValue[]
  sources: Source[]
  assets: Asset[]
  flashcards: Flashcard[]
  flashcardSources: FlashcardSource[]
  entityLinks: EntityLink[]
  suggestions: AiSuggestion[]
  suggestionTargets: AiSuggestionTarget[]
}

const defaultTables: TableSeed[] = [
  {
    slug: "images",
    name: "Images",
    tableType: "images",
    description: "Structured images used inline or as study references.",
  },
  {
    slug: "persons",
    name: "Persons",
    tableType: "persons",
    description: "People, authors, rulers, researchers, and named actors.",
  },
  {
    slug: "events",
    name: "Events",
    tableType: "events",
    description: "Dated events, milestones, and timeline entries.",
  },
  {
    slug: "places",
    name: "Places",
    tableType: "places",
    description: "Locations, regions, and spatial references.",
  },
  {
    slug: "definitions",
    name: "Definitions",
    tableType: "definitions",
    description: "Terms, concepts, formulas, and grammar patterns.",
  },
]

const courseSeeds: CourseSeed[] = [
  {
    key: "history",
    id: "course_history",
    title: "European History Foundations",
    description:
      "A structured history course with source-linked notes, people, places, events, definitions, and exam-focused review cards.",
    mainLanguage: "en",
    subject: "History",
    difficultyLevel: "intermediate",
    status: "active",
    examDate: "2026-06-18",
    targetDate: "2026-06-12",
    sourceType: "lecture",
    estimatedStudyMinutes: 1260,
    masteryScore: 47,
    confidenceScore: 52,
    tags: ["history", "exam-prep", "europe"],
    customTables: [
      {
        slug: "primary_sources",
        name: "Primary Sources",
        tableType: "custom",
        description: "Treaties, declarations, speeches, and archival snippets.",
      },
      {
        slug: "concepts",
        name: "Concepts",
        tableType: "custom",
        description: "Reusable analytical concepts for essay planning.",
      },
    ],
    sources: [
      {
        suffix: "lecture_revolution",
        sourceType: "lecture",
        title: "Lecture notes: Revolution and State Formation",
        author: "Course instructor",
        citation: "Week 2 lecture packet",
        pageStart: "12",
        pageEnd: "18",
      },
      {
        suffix: "seminar_nationalism",
        sourceType: "seminar",
        title: "Seminar outline: Nationalism and Unification",
        citation: "Week 5 seminar guide",
      },
      {
        suffix: "map_packet",
        sourceType: "map",
        title: "Map packet: Europe 1789-1871",
        citation: "Course map appendix",
      },
    ],
    assets: [
      {
        suffix: "map_1789",
        fileName: "europe-1789-map.png",
        mimeType: "image/png",
        assetType: "image",
        bucket: "course-images",
        storagePath: "profile_demo/course_history/images/europe-1789-map.png",
        fileSizeBytes: 284000,
        sourceSuffix: "map_packet",
      },
      {
        suffix: "revolution_timeline",
        fileName: "revolution-timeline.pdf",
        mimeType: "application/pdf",
        assetType: "document",
        bucket: "course-documents",
        storagePath: "profile_demo/course_history/documents/revolution-timeline.pdf",
        fileSizeBytes: 820000,
        sourceSuffix: "lecture_revolution",
      },
    ],
    records: [
      {
        suffix: "louis_xvi",
        tableSlug: "persons",
        title: "Louis XVI",
        recordType: "person",
        description: "King of France whose reign faced acute fiscal and political crisis before 1789.",
        sourceSuffix: "lecture_revolution",
        aliases: ["Louis-Auguste"],
        translations: { fr: ["Louis XVI"], nl: ["Lodewijk XVI"] },
        tags: ["monarchy", "france"],
      },
      {
        suffix: "robespierre",
        tableSlug: "persons",
        title: "Maximilien Robespierre",
        recordType: "person",
        description: "Revolutionary figure associated with virtue, terror, and the Committee of Public Safety.",
        sourceSuffix: "lecture_revolution",
        tags: ["revolution", "jacobins"],
      },
      {
        suffix: "bismarck",
        tableSlug: "persons",
        title: "Otto von Bismarck",
        recordType: "person",
        description: "Prussian statesman who shaped German unification through diplomacy and conflict.",
        sourceSuffix: "seminar_nationalism",
        tags: ["germany", "nationalism"],
      },
      {
        suffix: "estates_general",
        tableSlug: "definitions",
        title: "Estates-General",
        recordType: "definition",
        description: "Assembly representing clergy, nobility, and commoners in pre-revolutionary France.",
        sourceSuffix: "lecture_revolution",
        aliases: ["States-General"],
        translations: { fr: ["Etats generaux"], nl: ["Staten-Generaal"] },
        tags: ["institutions", "revolution"],
      },
      {
        suffix: "sovereignty",
        tableSlug: "concepts",
        title: "Sovereignty",
        recordType: "concept",
        description: "The claim to final political authority within a defined community or territory.",
        sourceSuffix: "lecture_revolution",
        tags: ["state", "concept"],
      },
      {
        suffix: "nationalism",
        tableSlug: "definitions",
        title: "Nationalism",
        recordType: "definition",
        description: "Political idea that a people with shared identity should form or control a state.",
        sourceSuffix: "seminar_nationalism",
        tags: ["identity", "unification"],
      },
      {
        suffix: "vienna_congress",
        tableSlug: "events",
        title: "Congress of Vienna",
        recordType: "event",
        description: "Post-Napoleonic diplomatic settlement that tried to restore balance in Europe.",
        sourceSuffix: "seminar_nationalism",
        tags: ["1815", "diplomacy"],
      },
      {
        suffix: "bastille",
        tableSlug: "events",
        title: "Storming of the Bastille",
        recordType: "event",
        description: "Symbolic revolutionary event in Paris on 14 July 1789.",
        sourceSuffix: "lecture_revolution",
        tags: ["1789", "paris"],
      },
      {
        suffix: "versailles",
        tableSlug: "places",
        title: "Versailles",
        recordType: "place",
        description: "Royal center associated with court politics and symbolic distance from Paris.",
        sourceSuffix: "lecture_revolution",
        tags: ["france", "court"],
      },
      {
        suffix: "paris",
        tableSlug: "places",
        title: "Paris",
        recordType: "place",
        description: "Urban center where revolutionary crowds, clubs, and assemblies shaped political pressure.",
        sourceSuffix: "lecture_revolution",
        tags: ["france", "urban"],
      },
      {
        suffix: "europe_1789_map",
        tableSlug: "images",
        title: "Europe in 1789 map",
        recordType: "image",
        description: "Reference map for borders, empires, and revolutionary geography.",
        sourceSuffix: "map_packet",
        tags: ["map", "visual"],
      },
      {
        suffix: "declaration_rights",
        tableSlug: "primary_sources",
        title: "Declaration of Rights excerpt",
        recordType: "primary_source",
        description: "Short classroom excerpt used to discuss liberty, property, and citizenship claims.",
        sourceSuffix: "lecture_revolution",
        tags: ["rights", "source"],
      },
      {
        suffix: "realpolitik",
        tableSlug: "concepts",
        title: "Realpolitik",
        recordType: "concept",
        description: "Pragmatic political strategy focused on power, constraints, and outcomes.",
        sourceSuffix: "seminar_nationalism",
        tags: ["diplomacy", "concept"],
      },
      {
        suffix: "third_estate",
        tableSlug: "definitions",
        title: "Third Estate",
        recordType: "definition",
        description: "The commoners in the French estate system, including urban workers and many professionals.",
        sourceSuffix: "lecture_revolution",
        tags: ["society", "france"],
      },
      {
        suffix: "german_empire_1871",
        tableSlug: "events",
        title: "German Empire proclaimed",
        recordType: "event",
        description: "The 1871 proclamation at Versailles that marked German national unification.",
        sourceSuffix: "seminar_nationalism",
        tags: ["1871", "germany"],
      },
    ],
    modules: [
      {
        title: "Revolutions and State Power",
        chapter: "The French Revolution",
        sections: [
          {
            title: "Causes and Pressures",
            subsection: {
              suffix: "fiscal_crisis",
              title: "Fiscal Crisis",
              topic: "the fiscal crisis before 1789",
              term: "Fiscal crisis",
              paragraph:
                "The monarchy faced debt, uneven taxation, and political resistance. Louis XVI needed consent for new taxes, but the estate system made agreement fragile.",
              definition:
                "A fiscal crisis occurs when a state cannot reliably cover obligations through ordinary revenue.",
              example:
                "A useful essay link is the movement from financial pressure to political legitimacy questions.",
              question: "Why did a financial problem become a constitutional crisis?",
              summary:
                "The fiscal crisis mattered because it pushed the monarchy to call the Estates-General and exposed competing claims about authority.",
              primaryRecordSuffix: "louis_xvi",
              special: {
                type: "warning",
                text: "Do not explain the Revolution with debt alone. Connect debt to consent, representation, and political legitimacy.",
              },
            },
          },
          {
            title: "Representation",
            subsection: {
              suffix: "estate_system",
              title: "Estate System",
              topic: "the estate system and representation",
              term: "Estate system",
              paragraph:
                "French society was described through three estates, but social reality was more varied than the model suggested. Conflicts over voting by order or by head made representation politically explosive.",
              definition:
                "The estate system divided political identity into clergy, nobility, and commoners.",
              example:
                "The Third Estate could frame its grievance as both a social and national claim.",
              question: "How did voting procedure shape the meaning of political equality?",
              summary:
                "Representation became a source of truth for revolutionary conflict because procedural rules decided whose voice counted.",
              primaryRecordSuffix: "estates_general",
              special: {
                type: "quote",
                text: "Classroom quote paraphrase: a procedural dispute can become a sovereignty dispute when groups disagree about who represents the nation.",
              },
            },
          },
        ],
      },
      {
        title: "Nationalism and Unification",
        chapter: "The Long Nineteenth Century",
        sections: [
          {
            title: "Diplomacy After Napoleon",
            subsection: {
              suffix: "vienna_balance",
              title: "Vienna Settlement",
              topic: "the Congress of Vienna and balance of power",
              term: "Balance of power",
              paragraph:
                "The Congress of Vienna sought stability by restoring dynasties and balancing major powers. It did not erase nationalist pressures, but it shaped the diplomatic environment they entered.",
              definition:
                "Balance of power means arranging relations so no single state can dominate the system easily.",
              example: "The settlement can be compared with later unification movements that revised the map.",
              question: "What problem was Vienna trying to solve after Napoleon?",
              summary:
                "Vienna created a conservative order that stabilized Europe while leaving unresolved questions about nationhood.",
              primaryRecordSuffix: "vienna_congress",
              special: {
                type: "image",
                text: "Map marker: compare borders before and after the Napoleonic period.",
                assetSuffix: "map_1789",
              },
            },
          },
          {
            title: "German Unification",
            subsection: {
              suffix: "bismarck_unification",
              title: "Bismarck and Unification",
              topic: "Bismarck's role in German unification",
              term: "Realpolitik",
              paragraph:
                "Bismarck used diplomacy, selective conflict, and Prussian state capacity to shift the German question. National feeling mattered, but it was organized through power politics.",
              definition:
                "Realpolitik is political action guided by practical constraints and power rather than abstract ideals alone.",
              example: "A strong answer separates popular nationalism from state-led unification strategy.",
              question: "How did Bismarck turn nationalist energy into a Prussian-led state project?",
              summary:
                "German unification is best studied as an interaction between identity, institutions, war, and diplomatic timing.",
              primaryRecordSuffix: "bismarck",
              special: {
                type: "note",
                text: "When reviewing this topic, link people to events so flashcards do not become isolated biographies.",
              },
            },
          },
        ],
      },
    ],
    anchors: [
      {
        blockSuffix: "fiscal_crisis_paragraph",
        recordSuffix: "louis_xvi",
        selectedText: "Louis XVI",
        linkType: "mentions",
      },
      {
        blockSuffix: "estate_system_paragraph",
        recordSuffix: "estates_general",
        selectedText: "three estates",
        linkType: "defines",
      },
      {
        blockSuffix: "bismarck_unification_paragraph",
        recordSuffix: "bismarck",
        selectedText: "Bismarck",
        linkType: "mentions",
      },
    ],
  },
  {
    key: "bio",
    id: "course_biology",
    title: "Cell Biology and Genetics",
    description:
      "A biology course with processes, diagrams, formulas, lab sources, and review cards for concept mastery.",
    mainLanguage: "en",
    subject: "Biology",
    difficultyLevel: "intro",
    status: "active",
    examDate: "2026-05-29",
    targetDate: "2026-05-24",
    sourceType: "lab manual",
    estimatedStudyMinutes: 980,
    masteryScore: 58,
    confidenceScore: 55,
    tags: ["biology", "lab", "diagrams"],
    customTables: [
      {
        slug: "processes",
        name: "Processes",
        tableType: "custom",
        description: "Biological processes with stages, inputs, and outputs.",
      },
      {
        slug: "formulas",
        name: "Formulas",
        tableType: "custom",
        description: "Quantitative formulas and symbolic relationships.",
      },
    ],
    sources: [
      {
        suffix: "cell_chapter",
        sourceType: "textbook",
        title: "Textbook chapter placeholder: Cells and Membranes",
        citation: "Chapter 3 study packet",
        pageStart: "44",
        pageEnd: "71",
      },
      {
        suffix: "genetics_lab",
        sourceType: "lab manual",
        title: "Lab manual: Mendelian inheritance simulation",
        citation: "Lab 4 manual",
      },
      {
        suffix: "microscopy_video",
        sourceType: "video",
        title: "Video lecture: Microscopy and organelles",
        url: "https://example.edu/demo/microscopy",
      },
    ],
    assets: [
      {
        suffix: "cell_diagram",
        fileName: "animal-cell-diagram.png",
        mimeType: "image/png",
        assetType: "image",
        bucket: "course-images",
        storagePath: "profile_demo/course_biology/images/animal-cell-diagram.png",
        fileSizeBytes: 340000,
        sourceSuffix: "microscopy_video",
      },
      {
        suffix: "punnett_grid",
        fileName: "punnett-square-grid.png",
        mimeType: "image/png",
        assetType: "image",
        bucket: "course-images",
        storagePath: "profile_demo/course_biology/images/punnett-square-grid.png",
        fileSizeBytes: 190000,
        sourceSuffix: "genetics_lab",
      },
    ],
    records: [
      {
        suffix: "nucleus",
        tableSlug: "definitions",
        title: "Nucleus",
        recordType: "definition",
        description: "Membrane-bound organelle that stores most eukaryotic genetic material.",
        sourceSuffix: "cell_chapter",
        tags: ["organelle", "dna"],
      },
      {
        suffix: "mitochondrion",
        tableSlug: "definitions",
        title: "Mitochondrion",
        recordType: "definition",
        description: "Organelle associated with ATP production through cellular respiration.",
        sourceSuffix: "cell_chapter",
        aliases: ["mitochondria"],
        tags: ["organelle", "energy"],
      },
      {
        suffix: "osmosis",
        tableSlug: "processes",
        title: "Osmosis",
        recordType: "process",
        description: "Movement of water across a selectively permeable membrane down water potential.",
        sourceSuffix: "cell_chapter",
        tags: ["membrane", "transport"],
      },
      {
        suffix: "active_transport",
        tableSlug: "processes",
        title: "Active transport",
        recordType: "process",
        description: "Movement across membranes that requires energy to move against a gradient.",
        sourceSuffix: "cell_chapter",
        tags: ["membrane", "energy"],
      },
      {
        suffix: "mitosis",
        tableSlug: "processes",
        title: "Mitosis",
        recordType: "process",
        description: "Nuclear division that produces genetically identical daughter nuclei.",
        sourceSuffix: "cell_chapter",
        tags: ["cell-cycle", "division"],
      },
      {
        suffix: "meiosis",
        tableSlug: "processes",
        title: "Meiosis",
        recordType: "process",
        description: "Cell division process that produces haploid gametes and genetic variation.",
        sourceSuffix: "genetics_lab",
        tags: ["inheritance", "variation"],
      },
      {
        suffix: "allele",
        tableSlug: "definitions",
        title: "Allele",
        recordType: "definition",
        description: "Alternative version of a gene at a particular locus.",
        sourceSuffix: "genetics_lab",
        tags: ["genetics"],
      },
      {
        suffix: "genotype",
        tableSlug: "definitions",
        title: "Genotype",
        recordType: "definition",
        description: "The allele combination an organism carries for a trait.",
        sourceSuffix: "genetics_lab",
        tags: ["genetics"],
      },
      {
        suffix: "phenotype",
        tableSlug: "definitions",
        title: "Phenotype",
        recordType: "definition",
        description: "Observable trait expression shaped by genotype and environment.",
        sourceSuffix: "genetics_lab",
        tags: ["genetics"],
      },
      {
        suffix: "atp_yield",
        tableSlug: "formulas",
        title: "ATP yield estimate",
        recordType: "formula",
        description: "Simplified reminder that aerobic respiration produces substantially more ATP than fermentation.",
        sourceSuffix: "cell_chapter",
        tags: ["energy", "formula"],
      },
      {
        suffix: "surface_area_volume",
        tableSlug: "formulas",
        title: "Surface area to volume ratio",
        recordType: "formula",
        description: "Ratio used to explain why cell size affects exchange efficiency.",
        sourceSuffix: "cell_chapter",
        tags: ["cells", "formula"],
      },
      {
        suffix: "animal_cell_diagram",
        tableSlug: "images",
        title: "Animal cell diagram",
        recordType: "image",
        description: "Diagram showing nucleus, membrane, mitochondria, and cytoplasm.",
        sourceSuffix: "microscopy_video",
        tags: ["diagram", "organelle"],
      },
      {
        suffix: "punnett_square",
        tableSlug: "images",
        title: "Punnett square grid",
        recordType: "image",
        description: "Visual grid for predicting allele combinations in a monohybrid cross.",
        sourceSuffix: "genetics_lab",
        tags: ["genetics", "visual"],
      },
      {
        suffix: "mendel",
        tableSlug: "persons",
        title: "Gregor Mendel",
        recordType: "person",
        description: "Researcher associated with foundational inheritance patterns.",
        sourceSuffix: "genetics_lab",
        tags: ["genetics", "history"],
      },
      {
        suffix: "pea_cross_event",
        tableSlug: "events",
        title: "Pea plant crossing experiments",
        recordType: "event",
        description: "Classroom shorthand for the controlled crosses used to reason about inheritance.",
        sourceSuffix: "genetics_lab",
        tags: ["inheritance", "experiment"],
      },
    ],
    modules: [
      {
        title: "Cell Structure",
        chapter: "Organelles and Membranes",
        sections: [
          {
            title: "Eukaryotic Organization",
            subsection: {
              suffix: "organelles",
              title: "Organelles as Compartments",
              topic: "organelles and compartmentalization",
              term: "Organelle",
              paragraph:
                "Eukaryotic cells divide work among organelles. This compartmentalization lets reactions occur in controlled spaces instead of one undifferentiated cytoplasm.",
              definition:
                "An organelle is a specialized cellular structure that performs a particular function.",
              example: "The nucleus protects genetic information while mitochondria support energy transfer.",
              question: "Why does compartmentalization help a cell regulate chemical activity?",
              summary:
                "Organelles make cellular organization easier to study because structure and function are linked.",
              primaryRecordSuffix: "nucleus",
              special: {
                type: "image",
                text: "Diagram marker: locate the nucleus and mitochondria before reviewing function cards.",
                assetSuffix: "cell_diagram",
              },
            },
          },
          {
            title: "Membrane Movement",
            subsection: {
              suffix: "membrane_transport",
              title: "Membrane Transport",
              topic: "movement across membranes",
              term: "Selective permeability",
              paragraph:
                "Membranes control exchange by allowing some substances to pass more easily than others. Passive movement follows gradients, while active movement requires energy.",
              definition:
                "Selective permeability means a membrane controls which substances cross and how easily they move.",
              example: "Osmosis explains water movement, while active transport explains movement against a gradient.",
              question: "How can the same membrane support passive and active movement?",
              summary:
                "Transport cards should separate direction of movement, energy use, and membrane structure.",
              primaryRecordSuffix: "osmosis",
              special: {
                type: "table",
                text: "Transport comparison table: diffusion uses no ATP, osmosis moves water, active transport uses energy.",
                rows: [
                  ["Process", "Energy", "Direction"],
                  ["Diffusion", "No ATP", "Down gradient"],
                  ["Active transport", "ATP often required", "Against gradient"],
                ],
              },
            },
          },
        ],
      },
      {
        title: "Inheritance",
        chapter: "Cell Division and Genetics",
        sections: [
          {
            title: "Division",
            subsection: {
              suffix: "mitosis_meiosis",
              title: "Mitosis and Meiosis",
              topic: "mitosis and meiosis",
              term: "Cell division",
              paragraph:
                "Mitosis maintains chromosome number for growth and repair. Meiosis reduces chromosome number and creates variation for sexual reproduction.",
              definition:
                "Cell division is the process by which cells produce new cells through organized chromosome movement.",
              example: "A common mistake is to describe meiosis as simply two rounds of mitosis.",
              question: "Which outcome distinguishes meiosis from mitosis?",
              summary:
                "The review priority is outcome: identical diploid cells for mitosis, varied haploid gametes for meiosis.",
              primaryRecordSuffix: "mitosis",
              special: {
                type: "warning",
                text: "Do not memorize only phase names. Tie each phase to chromosome behavior and final cell type.",
              },
            },
          },
          {
            title: "Mendelian Reasoning",
            subsection: {
              suffix: "inheritance_patterns",
              title: "Inheritance Patterns",
              topic: "basic Mendelian inheritance",
              term: "Genotype",
              paragraph:
                "A genotype records allele combinations, while a phenotype describes observable expression. Punnett squares are visual tools for reasoning about probability, not guarantees for one offspring.",
              definition:
                "A genotype is the allele combination an organism carries for a trait.",
              example: "A heterozygous cross can produce a predictable ratio over many offspring.",
              question: "Why is probability language important when using a Punnett square?",
              summary:
                "Genetics review should keep allele notation, phenotype language, and probability separate.",
              primaryRecordSuffix: "genotype",
              special: {
                type: "formula",
                text: "For a monohybrid heterozygous cross, expected genotype ratio is 1:2:1.",
                formula: "Aa x Aa -> 1 AA : 2 Aa : 1 aa",
              },
            },
          },
        ],
      },
    ],
    anchors: [
      {
        blockSuffix: "organelles_paragraph",
        recordSuffix: "nucleus",
        selectedText: "nucleus",
        linkType: "mentions",
      },
      {
        blockSuffix: "membrane_transport_example",
        recordSuffix: "osmosis",
        selectedText: "Osmosis",
        linkType: "example_of",
      },
      {
        blockSuffix: "inheritance_patterns_paragraph",
        recordSuffix: "punnett_square",
        selectedText: "Punnett squares",
        linkType: "visualizes",
      },
    ],
  },
  {
    key: "tech",
    id: "course_fullstack",
    title: "Full-Stack TypeScript with Supabase",
    description:
      "A technical study course covering React, typed data models, Supabase policies, Edge Functions, and deployment review.",
    mainLanguage: "en",
    subject: "Software Engineering",
    difficultyLevel: "advanced",
    status: "draft",
    examDate: "2026-07-10",
    targetDate: "2026-06-30",
    sourceType: "documentation",
    estimatedStudyMinutes: 1560,
    masteryScore: 36,
    confidenceScore: 41,
    tags: ["typescript", "supabase", "architecture"],
    customTables: [
      {
        slug: "apis",
        name: "APIs",
        tableType: "custom",
        description: "Client APIs, server endpoints, and function contracts.",
      },
      {
        slug: "decisions",
        name: "Architecture Decisions",
        tableType: "custom",
        description: "Important design decisions and tradeoffs.",
      },
    ],
    sources: [
      {
        suffix: "react_notes",
        sourceType: "documentation",
        title: "React architecture notes",
        citation: "Internal learning notes",
      },
      {
        suffix: "supabase_docs",
        sourceType: "documentation",
        title: "Supabase RLS and Edge Function notes",
        url: "https://supabase.com/docs",
      },
      {
        suffix: "deployment_checklist",
        sourceType: "manual",
        title: "Deployment checklist draft",
        citation: "Project operations note",
      },
    ],
    assets: [
      {
        suffix: "schema_diagram",
        fileName: "study-schema-diagram.png",
        mimeType: "image/png",
        assetType: "image",
        bucket: "course-images",
        storagePath: "profile_demo/course_fullstack/images/study-schema-diagram.png",
        fileSizeBytes: 228000,
        sourceSuffix: "supabase_docs",
      },
      {
        suffix: "rls_checklist",
        fileName: "rls-checklist.md",
        mimeType: "text/plain",
        assetType: "document",
        bucket: "course-documents",
        storagePath: "profile_demo/course_fullstack/documents/rls-checklist.md",
        fileSizeBytes: 24000,
        sourceSuffix: "deployment_checklist",
      },
    ],
    records: [
      {
        suffix: "react_router",
        tableSlug: "apis",
        title: "React Router routes",
        recordType: "api",
        description: "Route map that connects dashboard, course workspace, study sessions, import, and export views.",
        sourceSuffix: "react_notes",
        tags: ["frontend", "routing"],
      },
      {
        suffix: "tanstack_query",
        tableSlug: "definitions",
        title: "TanStack Query",
        recordType: "definition",
        description: "Client server-state library useful for caching Supabase reads and mutations.",
        sourceSuffix: "react_notes",
        tags: ["frontend", "state"],
      },
      {
        suffix: "row_level_security",
        tableSlug: "definitions",
        title: "Row Level Security",
        recordType: "definition",
        description: "Postgres policy layer that restricts rows based on the authenticated user.",
        sourceSuffix: "supabase_docs",
        aliases: ["RLS"],
        tags: ["security", "database"],
      },
      {
        suffix: "edge_function",
        tableSlug: "apis",
        title: "AI suggestion Edge Function",
        recordType: "api",
        description: "Server-side function that sends selected source context to AI and stores reviewable suggestions.",
        sourceSuffix: "supabase_docs",
        tags: ["ai", "server"],
      },
      {
        suffix: "studydata_context",
        tableSlug: "decisions",
        title: "StudyData provider",
        recordType: "decision",
        description: "Local MVP state container that keeps demo persistence independent from future Supabase repositories.",
        sourceSuffix: "react_notes",
        tags: ["state", "mvp"],
      },
      {
        suffix: "source_of_truth",
        tableSlug: "concepts",
        title: "Source-of-truth boundary",
        recordType: "concept",
        description: "Content and appendices can change source knowledge; flashcards remain derived and traceable.",
        sourceSuffix: "react_notes",
        tags: ["architecture", "integrity"],
      },
      {
        suffix: "content_block",
        tableSlug: "definitions",
        title: "Content block",
        recordType: "definition",
        description: "Structured unit of course material such as paragraph, definition, warning, image, or formula.",
        sourceSuffix: "react_notes",
        tags: ["editor", "data-model"],
      },
      {
        suffix: "text_anchor",
        tableSlug: "definitions",
        title: "Text anchor",
        recordType: "definition",
        description: "Exact span reference that stores offsets, selected text, context, version, and hash.",
        sourceSuffix: "react_notes",
        tags: ["linking", "editor"],
      },
      {
        suffix: "supabase_storage",
        tableSlug: "definitions",
        title: "Supabase Storage",
        recordType: "definition",
        description: "Storage layer for images, imports, documents, and exported course artifacts.",
        sourceSuffix: "supabase_docs",
        tags: ["files", "backend"],
      },
      {
        suffix: "vite_build",
        tableSlug: "events",
        title: "Production build check",
        recordType: "event",
        description: "Validation step that confirms TypeScript and Vite can compile the app.",
        sourceSuffix: "deployment_checklist",
        tags: ["build", "quality"],
      },
      {
        suffix: "schema_diagram",
        tableSlug: "images",
        title: "Schema relationship diagram",
        recordType: "image",
        description: "Diagram for courses, content blocks, appendices, flashcards, and links.",
        sourceSuffix: "supabase_docs",
        tags: ["schema", "visual"],
      },
      {
        suffix: "optimistic_ui",
        tableSlug: "concepts",
        title: "Optimistic UI",
        recordType: "concept",
        description: "Interface pattern that updates locally before remote confirmation, then reconciles failures.",
        sourceSuffix: "react_notes",
        tags: ["frontend", "ux"],
      },
      {
        suffix: "migration",
        tableSlug: "definitions",
        title: "Database migration",
        recordType: "definition",
        description: "Versioned database change that creates or alters schema in a repeatable way.",
        sourceSuffix: "supabase_docs",
        tags: ["database"],
      },
      {
        suffix: "policy_test",
        tableSlug: "decisions",
        title: "RLS policy test strategy",
        recordType: "decision",
        description: "Verify owner-scoped reads and writes before relying on hosted data.",
        sourceSuffix: "deployment_checklist",
        tags: ["security", "tests"],
      },
      {
        suffix: "ai_validation",
        tableSlug: "decisions",
        title: "AI validation inbox",
        recordType: "decision",
        description: "AI writes suggestions first; users accept, edit, reject, or defer before source data changes.",
        sourceSuffix: "react_notes",
        tags: ["ai", "safety"],
      },
    ],
    modules: [
      {
        title: "Frontend Architecture",
        chapter: "React Workspace",
        sections: [
          {
            title: "Routing and Layout",
            subsection: {
              suffix: "routing_layout",
              title: "Routing and Layout",
              topic: "React routing and workspace shells",
              term: "Route shell",
              paragraph:
                "The app shell separates global navigation from course-specific tabs. This keeps the library, editor, review, and analytics flows predictable.",
              definition:
                "A route shell is a layout component that renders shared navigation around nested pages.",
              example: "The course workspace shell owns tabs while pages own their task-specific panels.",
              question: "Which state belongs in the shell and which belongs in a page?",
              summary:
                "Routing is easier to maintain when global layout and course workspace layout have separate responsibilities.",
              primaryRecordSuffix: "react_router",
              special: {
                type: "note",
                text: "Use route parameters as identifiers only. Fetch or derive display data from typed state.",
              },
            },
          },
          {
            title: "State and Data Flow",
            subsection: {
              suffix: "state_data_flow",
              title: "State and Data Flow",
              topic: "state ownership and server data",
              term: "Server state",
              paragraph:
                "Local UI state controls panels and selections, while server state should eventually come through query hooks. The demo provider mimics repositories without locking the UI to localStorage.",
              definition:
                "Server state is remote data that must be fetched, cached, synchronized, and invalidated.",
              example: "Course metadata can use query caching while a selected block editor uses local draft state.",
              question: "Why should server state not be treated like ordinary component state?",
              summary:
                "A clean state boundary makes the MVP easier to move from demo persistence to Supabase.",
              primaryRecordSuffix: "tanstack_query",
              special: {
                type: "example",
                text: "Example flow: mutate a flashcard review, update the due date locally, then invalidate the course metrics query.",
              },
            },
          },
        ],
      },
      {
        title: "Backend Architecture",
        chapter: "Supabase and AI",
        sections: [
          {
            title: "Data Security",
            subsection: {
              suffix: "rls_policies",
              title: "RLS Policies",
              topic: "row-level security and ownership",
              term: "Row Level Security",
              paragraph:
                "RLS policies keep user data scoped by course ownership. Tables that do not store owner IDs directly should check ownership through their parent course.",
              definition:
                "Row Level Security is a database mechanism that decides whether a user can see or change each row.",
              example: "A flashcard source is allowed only if its flashcard belongs to a course owned by the user.",
              question: "Why do child tables need ownership checks through parent records?",
              summary:
                "Security review should trace every row back to the owning profile or course.",
              primaryRecordSuffix: "row_level_security",
              special: {
                type: "warning",
                text: "Never rely only on client-side filtering for private course data.",
              },
            },
          },
          {
            title: "AI Safety",
            subsection: {
              suffix: "ai_suggestions",
              title: "AI Suggestions",
              topic: "safe AI-assisted study workflows",
              term: "Suggestion inbox",
              paragraph:
                "AI should receive only selected context and should create suggestions rather than mutating source-of-truth content. The user validates changes before they affect content or appendices.",
              definition:
                "A suggestion inbox is a review queue for AI outputs that can be accepted, edited, rejected, or deferred.",
              example: "Generated flashcards can be accepted immediately because they are derived, but content edits need a stricter preview.",
              question: "Why is AI allowed to create cards more freely than source content?",
              summary:
                "The safest AI architecture keeps source changes explicit and auditable.",
              primaryRecordSuffix: "ai_validation",
              special: {
                type: "table",
                text: "AI action table: flashcards are low risk, appendix suggestions are medium risk, source edits are high risk.",
                rows: [
                  ["Action", "Risk", "Validation"],
                  ["Flashcard suggestion", "Low", "Accept/edit/reject"],
                  ["Appendix merge", "Medium", "Preview affected links"],
                  ["Content rewrite", "High", "Explicit approval"],
                ],
              },
            },
          },
        ],
      },
    ],
    anchors: [
      {
        blockSuffix: "rls_policies_paragraph",
        recordSuffix: "row_level_security",
        selectedText: "RLS policies",
        linkType: "defines",
      },
      {
        blockSuffix: "ai_suggestions_paragraph",
        recordSuffix: "ai_validation",
        selectedText: "suggestions",
        linkType: "governs",
      },
      {
        blockSuffix: "state_data_flow_paragraph",
        recordSuffix: "tanstack_query",
        selectedText: "server state",
        linkType: "mentions",
      },
    ],
  },
  {
    key: "french",
    id: "course_french",
    title: "French A2 Grammar Review",
    description:
      "A multilingual language course with grammar patterns, vocabulary, aliases, translations, and mobile-friendly review cards.",
    mainLanguage: "fr",
    subject: "Languages",
    difficultyLevel: "intro",
    status: "active",
    examDate: "2026-06-04",
    targetDate: "2026-05-28",
    sourceType: "workbook",
    estimatedStudyMinutes: 720,
    masteryScore: 64,
    confidenceScore: 61,
    tags: ["french", "grammar", "a2"],
    customTables: [
      {
        slug: "grammar_patterns",
        name: "Grammar Patterns",
        tableType: "custom",
        description: "Reusable grammar structures with example sentences.",
      },
      {
        slug: "verbs",
        name: "Verbs",
        tableType: "custom",
        description: "Verb forms, conjugation notes, and common uses.",
      },
    ],
    sources: [
      {
        suffix: "workbook_a2",
        sourceType: "workbook",
        title: "French A2 grammar workbook",
        citation: "Unit 6-8 review packet",
      },
      {
        suffix: "listening_notes",
        sourceType: "lecture",
        title: "Listening class notes",
        citation: "Conversation practice handout",
      },
      {
        suffix: "verb_sheet",
        sourceType: "manual",
        title: "Verb conjugation sheet",
        citation: "Teacher-created reference",
      },
    ],
    assets: [
      {
        suffix: "metro_sign",
        fileName: "metro-sign-dialogue.png",
        mimeType: "image/png",
        assetType: "image",
        bucket: "course-images",
        storagePath: "profile_demo/course_french/images/metro-sign-dialogue.png",
        fileSizeBytes: 142000,
        sourceSuffix: "listening_notes",
      },
      {
        suffix: "verb_chart",
        fileName: "a2-verb-chart.pdf",
        mimeType: "application/pdf",
        assetType: "document",
        bucket: "course-documents",
        storagePath: "profile_demo/course_french/documents/a2-verb-chart.pdf",
        fileSizeBytes: 310000,
        sourceSuffix: "verb_sheet",
      },
    ],
    records: [
      {
        suffix: "passe_compose",
        tableSlug: "grammar_patterns",
        title: "Passe compose",
        recordType: "grammar_pattern",
        description: "Past tense pattern commonly built with avoir or etre plus a past participle.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        aliases: ["past tense"],
        translations: { en: ["compound past"], nl: ["voltooid verleden tijd"] },
        tags: ["tense", "past"],
      },
      {
        suffix: "imparfait",
        tableSlug: "grammar_patterns",
        title: "Imparfait",
        recordType: "grammar_pattern",
        description: "Past tense used for habits, background descriptions, and ongoing states.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        translations: { en: ["imperfect"], nl: ["onvoltooid verleden tijd"] },
        tags: ["tense", "description"],
      },
      {
        suffix: "partitive",
        tableSlug: "grammar_patterns",
        title: "Articles partitifs",
        recordType: "grammar_pattern",
        description: "Forms du, de la, de l', and des used for unspecified quantities.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        translations: { en: ["partitive articles"], nl: ["deelaanduidende lidwoorden"] },
        tags: ["articles"],
      },
      {
        suffix: "pronoun_y",
        tableSlug: "grammar_patterns",
        title: "Pronom y",
        recordType: "grammar_pattern",
        description: "Pronoun often replacing a place or phrase introduced by a.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        tags: ["pronouns"],
      },
      {
        suffix: "pronoun_en",
        tableSlug: "grammar_patterns",
        title: "Pronom en",
        recordType: "grammar_pattern",
        description: "Pronoun often replacing de plus a noun or an amount expression.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        tags: ["pronouns"],
      },
      {
        suffix: "aller",
        tableSlug: "verbs",
        title: "Aller",
        recordType: "verb",
        description: "Irregular verb meaning to go; also used for near future.",
        sourceSuffix: "verb_sheet",
        language: "fr",
        translations: { en: ["to go"], nl: ["gaan"] },
        tags: ["verb", "irregular"],
      },
      {
        suffix: "faire",
        tableSlug: "verbs",
        title: "Faire",
        recordType: "verb",
        description: "Irregular verb meaning to do or to make, common in weather and activity expressions.",
        sourceSuffix: "verb_sheet",
        language: "fr",
        translations: { en: ["to do", "to make"], nl: ["doen", "maken"] },
        tags: ["verb", "irregular"],
      },
      {
        suffix: "prendre",
        tableSlug: "verbs",
        title: "Prendre",
        recordType: "verb",
        description: "Irregular verb meaning to take; useful in food, transport, and daily routine phrases.",
        sourceSuffix: "verb_sheet",
        language: "fr",
        translations: { en: ["to take"], nl: ["nemen"] },
        tags: ["verb", "irregular"],
      },
      {
        suffix: "metro",
        tableSlug: "places",
        title: "Le metro",
        recordType: "place",
        description: "Common urban transport context for direction and ticket dialogues.",
        sourceSuffix: "listening_notes",
        language: "fr",
        translations: { en: ["subway"], nl: ["metro"] },
        tags: ["travel", "place"],
      },
      {
        suffix: "boulangerie",
        tableSlug: "places",
        title: "La boulangerie",
        recordType: "place",
        description: "Bakery context used for partitive articles and polite requests.",
        sourceSuffix: "listening_notes",
        language: "fr",
        translations: { en: ["bakery"], nl: ["bakkerij"] },
        tags: ["food", "place"],
      },
      {
        suffix: "metro_dialogue_image",
        tableSlug: "images",
        title: "Metro dialogue sign",
        recordType: "image",
        description: "Image prompt for recognizing directions and transport vocabulary.",
        sourceSuffix: "listening_notes",
        language: "fr",
        tags: ["image", "listening"],
      },
      {
        suffix: "polite_request",
        tableSlug: "definitions",
        title: "Je voudrais",
        recordType: "definition",
        description: "Polite request phrase meaning I would like.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        translations: { en: ["I would like"], nl: ["ik zou graag willen"] },
        tags: ["phrase", "politeness"],
      },
      {
        suffix: "yesterday_event",
        tableSlug: "events",
        title: "Hier soir",
        recordType: "event",
        description: "Time expression used to trigger past-tense narration practice.",
        sourceSuffix: "workbook_a2",
        language: "fr",
        translations: { en: ["last night"], nl: ["gisteravond"] },
        tags: ["time", "past"],
      },
      {
        suffix: "marie",
        tableSlug: "persons",
        title: "Marie",
        recordType: "person",
        description: "Recurring sample speaker in dialogues about travel, food, and weekend plans.",
        sourceSuffix: "listening_notes",
        language: "fr",
        tags: ["dialogue"],
      },
      {
        suffix: "near_future",
        tableSlug: "grammar_patterns",
        title: "Futur proche",
        recordType: "grammar_pattern",
        description: "Near future pattern: aller plus infinitive.",
        sourceSuffix: "verb_sheet",
        language: "fr",
        translations: { en: ["near future"], nl: ["nabije toekomst"] },
        tags: ["tense", "future"],
      },
    ],
    modules: [
      {
        title: "Past Tenses",
        chapter: "Narrating Events",
        sections: [
          {
            title: "Completed Actions",
            subsection: {
              suffix: "passe_compose_use",
              title: "Passe Compose",
              topic: "using the passe compose",
              term: "Passe compose",
              paragraph:
                "Le passe compose presente une action terminee. In A2 writing, it often answers what happened, when it happened, and who did it.",
              definition:
                "Le passe compose combines an auxiliary verb with a past participle to describe completed past actions.",
              example: "Hier soir, Marie a pris le metro et elle a achete du pain.",
              question: "Which helper verb do you need before the past participle?",
              summary:
                "Use passe compose for completed events and keep agreement rules visible when etre is the helper.",
              primaryRecordSuffix: "passe_compose",
              language: "fr",
              special: {
                type: "example",
                text: "Modele: J'ai visite le musee. Elle est allee a la gare.",
              },
            },
          },
          {
            title: "Background Description",
            subsection: {
              suffix: "imparfait_use",
              title: "Imparfait",
              topic: "using the imparfait",
              term: "Imparfait",
              paragraph:
                "L'imparfait donne le decor, les habitudes, et les descriptions. It often tells what was going on before a completed action interrupts.",
              definition:
                "L'imparfait is a past tense for habits, descriptions, and ongoing background states.",
              example: "Quand j'etais petit, je prenais toujours le bus pour aller a l'ecole.",
              question: "How does imparfait change the background of a story?",
              summary:
                "Use imparfait to set the scene and passe compose to move the event forward.",
              primaryRecordSuffix: "imparfait",
              language: "fr",
              special: {
                type: "warning",
                text: "Do not translate every English past-tense verb into passe compose. Ask whether the verb is event or background.",
              },
            },
          },
        ],
      },
      {
        title: "Daily Communication",
        chapter: "Requests and Movement",
        sections: [
          {
            title: "Food and Quantity",
            subsection: {
              suffix: "partitive_articles",
              title: "Partitive Articles",
              topic: "partitive articles for food and quantity",
              term: "Article partitif",
              paragraph:
                "Les articles partitifs express an unspecified amount. They are common with food, drink, and shopping phrases.",
              definition:
                "An article partitif marks an unspecified quantity, such as du pain or de la soupe.",
              example: "Je voudrais du pain, de la confiture, et de l'eau.",
              question: "Why does the form change after a negative expression?",
              summary:
                "Partitive review should connect noun gender, vowel sound, and negative de.",
              primaryRecordSuffix: "partitive",
              language: "fr",
              special: {
                type: "table",
                text: "Partitive table: du for masculine, de la for feminine, de l' before vowel, des for plural.",
                rows: [
                  ["Form", "Use", "Example"],
                  ["du", "masculine", "du pain"],
                  ["de la", "feminine", "de la soupe"],
                  ["de l'", "vowel", "de l'eau"],
                ],
              },
            },
          },
          {
            title: "Travel and Direction",
            subsection: {
              suffix: "pronouns_y_en",
              title: "Pronouns Y and En",
              topic: "using y and en in everyday answers",
              term: "Pronom adverbial",
              paragraph:
                "Y and en make answers shorter by replacing place phrases or de phrases. In conversation, they help avoid repeating the same noun phrase.",
              definition:
                "A pronom adverbial replaces a phrase linked to place, quantity, or de.",
              example: "Tu vas au metro? Oui, j'y vais. Tu veux du cafe? Oui, j'en veux.",
              question: "What phrase does y replace, and what phrase does en replace?",
              summary:
                "For A2 review, identify the replaced phrase before choosing y or en.",
              primaryRecordSuffix: "pronoun_y",
              language: "fr",
              special: {
                type: "image",
                text: "Image prompt: use the metro sign to answer a direction question with y.",
                assetSuffix: "metro_sign",
              },
            },
          },
        ],
      },
    ],
    anchors: [
      {
        blockSuffix: "passe_compose_use_paragraph",
        recordSuffix: "passe_compose",
        selectedText: "Le passe compose",
        linkType: "defines",
      },
      {
        blockSuffix: "partitive_articles_example",
        recordSuffix: "polite_request",
        selectedText: "Je voudrais",
        linkType: "uses_phrase",
      },
      {
        blockSuffix: "pronouns_y_en_example",
        recordSuffix: "metro",
        selectedText: "au metro",
        linkType: "place_context",
      },
    ],
  },
]

function hashText(text: string) {
  return `${text.length}:${text.slice(0, 32)}`
}

function tableId(key: string, slug: string) {
  return `${key}_table_${slug}`
}

function sourceId(key: string, suffix: string) {
  return `${key}_source_${suffix}`
}

function recordId(key: string, suffix: string) {
  return `${key}_record_${suffix}`
}

function blockId(key: string, suffix: string) {
  return `${key}_block_${suffix}`
}

function assetId(key: string, suffix: string) {
  return `${key}_asset_${suffix}`
}

function makeCourse(seed: CourseSeed): Course {
  return {
    id: seed.id,
    ownerId: profileId,
    title: seed.title,
    description: seed.description,
    mainLanguage: seed.mainLanguage,
    subject: seed.subject,
    difficultyLevel: seed.difficultyLevel,
    status: seed.status,
    examDate: seed.examDate,
    targetDate: seed.targetDate,
    sourceType: seed.sourceType,
    estimatedStudyMinutes: seed.estimatedStudyMinutes,
    masteryScore: seed.masteryScore,
    confidenceScore: seed.confidenceScore,
    tags: seed.tags,
    createdAt: now,
    updatedAt: now,
  }
}

function makeTables(seed: CourseSeed): AppendixTable[] {
  return [...defaultTables, ...seed.customTables].map((table, index) => ({
    id: tableId(seed.key, table.slug),
    courseId: seed.id,
    name: table.name,
    slug: table.slug,
    tableType: table.tableType,
    isDefault: index < defaultTables.length,
    description: table.description,
    position: index + 1,
    createdAt: now,
    updatedAt: now,
  }))
}

function makeFields(tables: AppendixTable[]): AppendixField[] {
  return tables.flatMap((table) => [
    {
      id: `${table.id}_field_summary`,
      appendixTableId: table.id,
      name: "Summary",
      slug: "summary",
      fieldType: "long_text",
      isRequired: false,
      position: 1,
      createdAt: now,
    },
    {
      id: `${table.id}_field_source`,
      appendixTableId: table.id,
      name: "Source note",
      slug: "source",
      fieldType: "text",
      isRequired: false,
      position: 2,
      createdAt: now,
    },
    {
      id: `${table.id}_field_review_priority`,
      appendixTableId: table.id,
      name: "Review priority",
      slug: "review_priority",
      fieldType: "select",
      isRequired: false,
      position: 3,
      options: { values: ["low", "medium", "high"] },
      createdAt: now,
    },
  ])
}

function makeSources(seed: CourseSeed): Source[] {
  return seed.sources.map((source) => ({
    id: sourceId(seed.key, source.suffix),
    courseId: seed.id,
    sourceType: source.sourceType,
    title: source.title,
    author: source.author,
    url: source.url,
    citation: source.citation,
    publisher: source.publisher,
    publishedDate: source.publishedDate,
    pageStart: source.pageStart,
    pageEnd: source.pageEnd,
    metadata: { demo: true },
    createdAt: now,
    updatedAt: now,
  }))
}

function makeAssets(seed: CourseSeed): Asset[] {
  return seed.assets.map((asset) => ({
    id: assetId(seed.key, asset.suffix),
    courseId: seed.id,
    ownerId: profileId,
    bucket: asset.bucket,
    storagePath: asset.storagePath,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    fileSizeBytes: asset.fileSizeBytes,
    assetType: asset.assetType,
    sourceId: asset.sourceSuffix ? sourceId(seed.key, asset.sourceSuffix) : undefined,
    metadata: { demo: true, placeholder: true },
    createdAt: now,
  }))
}

function makeRecords(seed: CourseSeed, fields: AppendixField[]): {
  records: AppendixRecord[]
  values: AppendixRecordValue[]
} {
  const records = seed.records.map<AppendixRecord>((record) => ({
    id: recordId(seed.key, record.suffix),
    courseId: seed.id,
    appendixTableId: tableId(seed.key, record.tableSlug),
    title: record.title,
    recordType: record.recordType,
    shortDescription: record.description,
    sourceId: record.sourceSuffix ? sourceId(seed.key, record.sourceSuffix) : undefined,
    language: record.language ?? seed.mainLanguage,
    aliases: record.aliases ?? [],
    translations: record.translations ?? {},
    tags: record.tags ?? [],
    userNotes: `Demo note: review this ${record.recordType} when studying ${seed.subject}.`,
    version: 1,
    recordHash: hashText(`${record.title}:${record.description}`),
    createdMethod: record.method ?? "manual",
    createdAt: now,
    updatedAt: now,
  }))

  const values = records.flatMap<AppendixRecordValue>((record, index) => {
    const summaryField = fields.find(
      (field) => field.appendixTableId === record.appendixTableId && field.slug === "summary",
    )
    const priorityField = fields.find(
      (field) => field.appendixTableId === record.appendixTableId && field.slug === "review_priority",
    )
    return [
      summaryField && {
        id: `${record.id}_value_summary`,
        appendixRecordId: record.id,
        appendixFieldId: summaryField.id,
        value: record.shortDescription,
        createdAt: now,
        updatedAt: now,
      },
      priorityField && {
        id: `${record.id}_value_priority`,
        appendixRecordId: record.id,
        appendixFieldId: priorityField.id,
        value: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
        createdAt: now,
        updatedAt: now,
      },
    ].filter(Boolean) as AppendixRecordValue[]
  })

  return { records, values }
}

function makeBlock(
  seed: CourseSeed,
  node: CourseNode,
  suffix: string,
  blockType: ContentBlockType,
  text: string,
  position: number,
  language?: Language,
  extra?: Pick<ContentBlock["content"], "formula" | "rows" | "src" | "caption" | "title">,
): ContentBlock {
  const isHeading = blockType === "heading"
  return {
    id: blockId(seed.key, suffix),
    courseId: seed.id,
    nodeId: node.id,
    blockType,
    position,
    depth: isHeading ? 1 : 2,
    content: {
      text,
      ...extra,
    },
    plainText: text,
    language: language ?? seed.mainLanguage,
    numberingPath: node.numberingPath,
    displayNumber: isHeading ? `${node.displayNumber}.1` : "",
    isCollapsible: isHeading,
    isCollapsed: false,
    version: 1,
    contentHash: hashText(text),
    createdAt: now,
    updatedAt: now,
  }
}

function makeNodesAndBlocks(seed: CourseSeed): {
  nodes: CourseNode[]
  blocks: ContentBlock[]
  subsectionBySuffix: Map<string, CourseNode>
  subsectionSeeds: SubsectionSeed[]
} {
  const nodes: CourseNode[] = []
  const blocks: ContentBlock[] = []
  const subsectionBySuffix = new Map<string, CourseNode>()
  const subsectionSeeds: SubsectionSeed[] = []

  seed.modules.forEach((moduleSeed, moduleIndex) => {
    const modulePath = makeNumberingPath([], 0, moduleIndex + 1)
    const moduleNode: CourseNode = {
      id: `${seed.key}_node_module_${moduleIndex + 1}`,
      courseId: seed.id,
      nodeType: "module",
      title: moduleSeed.title,
      position: moduleIndex + 1,
      depth: 0,
      numberingPath: modulePath,
      displayNumber: displayNumber(modulePath),
      language: seed.mainLanguage,
      isCollapsedDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    nodes.push(moduleNode)

    const chapterPath = makeNumberingPath(modulePath, 1, 1)
    const chapterNode: CourseNode = {
      id: `${seed.key}_node_chapter_${moduleIndex + 1}`,
      courseId: seed.id,
      parentId: moduleNode.id,
      nodeType: "chapter",
      title: moduleSeed.chapter,
      position: 1,
      depth: 1,
      numberingPath: chapterPath,
      displayNumber: displayNumber(chapterPath),
      language: seed.mainLanguage,
      isCollapsedDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    nodes.push(chapterNode)

    moduleSeed.sections.forEach((sectionSeed, sectionIndex) => {
      const sectionPath = makeNumberingPath(chapterPath, 2, sectionIndex + 1)
      const sectionNode: CourseNode = {
        id: `${seed.key}_node_section_${moduleIndex + 1}_${sectionIndex + 1}`,
        courseId: seed.id,
        parentId: chapterNode.id,
        nodeType: "section",
        title: sectionSeed.title,
        position: sectionIndex + 1,
        depth: 2,
        numberingPath: sectionPath,
        displayNumber: displayNumber(sectionPath),
        language: sectionSeed.subsection.language ?? seed.mainLanguage,
        isCollapsedDefault: false,
        createdAt: now,
        updatedAt: now,
      }
      nodes.push(sectionNode)

      const subsectionPath = makeNumberingPath(sectionPath, 3, 1)
      const subsectionNode: CourseNode = {
        id: `${seed.key}_node_subsection_${sectionSeed.subsection.suffix}`,
        courseId: seed.id,
        parentId: sectionNode.id,
        nodeType: "subsection",
        title: sectionSeed.subsection.title,
        position: 1,
        depth: 3,
        numberingPath: subsectionPath,
        displayNumber: displayNumber(subsectionPath),
        language: sectionSeed.subsection.language ?? seed.mainLanguage,
        isCollapsedDefault: false,
        createdAt: now,
        updatedAt: now,
      }
      nodes.push(subsectionNode)
      subsectionBySuffix.set(sectionSeed.subsection.suffix, subsectionNode)
      subsectionSeeds.push(sectionSeed.subsection)

      const sub = sectionSeed.subsection
      const specialExtra =
        sub.special.type === "formula"
          ? { formula: sub.special.formula }
          : sub.special.type === "table"
            ? { rows: sub.special.rows }
            : sub.special.type === "image"
              ? {
                  src: sub.special.assetSuffix ? seed.assets.find((asset) => asset.suffix === sub.special.assetSuffix)?.storagePath : undefined,
                  caption: sub.special.text,
                  title: sub.special.assetSuffix,
                }
              : undefined

      blocks.push(
        makeBlock(seed, subsectionNode, `${sub.suffix}_heading`, "heading", sub.title, 1, sub.language),
        makeBlock(seed, subsectionNode, `${sub.suffix}_paragraph`, "paragraph", sub.paragraph, 2, sub.language),
        makeBlock(seed, subsectionNode, `${sub.suffix}_definition`, "definition", `${sub.term}: ${sub.definition}`, 3, sub.language),
        makeBlock(seed, subsectionNode, `${sub.suffix}_example`, "example", sub.example, 4, sub.language),
        makeBlock(seed, subsectionNode, `${sub.suffix}_${sub.special.type}`, sub.special.type, sub.special.text, 5, sub.language, specialExtra),
        makeBlock(seed, subsectionNode, `${sub.suffix}_question`, "question", sub.question, 6, sub.language),
        makeBlock(seed, subsectionNode, `${sub.suffix}_summary`, "summary", sub.summary, 7, sub.language),
      )
    })
  })

  return { nodes, blocks, subsectionBySuffix, subsectionSeeds }
}

function makeAnchorsAndLinks(
  seed: CourseSeed,
  blocks: ContentBlock[],
  records: AppendixRecord[],
  assets: Asset[],
): {
  anchors: ContentTextAnchor[]
  links: EntityLink[]
} {
  const anchors: ContentTextAnchor[] = []
  const links: EntityLink[] = []

  seed.anchors.forEach((anchorSeed, index) => {
    const block = blocks.find((item) => item.id === blockId(seed.key, anchorSeed.blockSuffix))
    const record = records.find((item) => item.id === recordId(seed.key, anchorSeed.recordSuffix))
    if (!block || !record) return

    const startOffset = Math.max(0, block.plainText.indexOf(anchorSeed.selectedText))
    const endOffset = startOffset + anchorSeed.selectedText.length
    const anchor: ContentTextAnchor = {
      id: `${seed.key}_anchor_${index + 1}`,
      courseId: seed.id,
      contentBlockId: block.id,
      blockVersion: block.version,
      startOffset,
      endOffset,
      selectedText: anchorSeed.selectedText,
      prefixContext: block.plainText.slice(Math.max(0, startOffset - 24), startOffset),
      suffixContext: block.plainText.slice(endOffset, endOffset + 24),
      textHash: hashText(anchorSeed.selectedText),
      anchorStatus: index % 4 === 3 ? "needs_review" : "active",
      createdAt: now,
      updatedAt: now,
    }
    anchors.push(anchor)
    links.push(
      {
        id: `${seed.key}_link_block_${index + 1}`,
        courseId: seed.id,
        fromType: "content_block",
        fromId: block.id,
        toType: "appendix_record",
        toId: record.id,
        linkType: anchorSeed.linkType,
        anchorId: anchor.id,
        metadata: { selectedText: anchorSeed.selectedText },
        createdMethod: "manual",
        createdAt: now,
      },
      {
        id: `${seed.key}_link_anchor_${index + 1}`,
        courseId: seed.id,
        fromType: "text_anchor",
        fromId: anchor.id,
        toType: "appendix_record",
        toId: record.id,
        linkType: "precise_span",
        anchorId: anchor.id,
        metadata: { selectedText: anchorSeed.selectedText },
        createdMethod: "manual",
        createdAt: now,
      },
    )
  })

  records
    .filter((record) => record.recordType === "image")
    .forEach((record, index) => {
      const asset = assets[index % Math.max(assets.length, 1)]
      if (!asset) return
      links.push({
        id: `${seed.key}_link_asset_${index + 1}`,
        courseId: seed.id,
        fromType: "appendix_record",
        fromId: record.id,
        toType: "asset",
        toId: asset.id,
        linkType: "stored_as",
        metadata: { fileName: asset.fileName },
        createdMethod: "system",
        createdAt: now,
      })
    })

  return { anchors, links }
}

function scheduleForIndex(index: number) {
  const dueDates = [dueOld, duePast, dueToday, dueTomorrow, dueFuture]
  const mastery = [24, 41, 57, 73, 88, 36, 52, 67]
  const confidence = [20, 45, 49, 70, 82, 31, 55, 61]
  const reviewCount = index % 6 === 0 ? 0 : (index % 5) + 1

  return {
    dueAt: reviewCount === 0 ? dueToday : dueDates[index % dueDates.length],
    intervalDays: reviewCount === 0 ? 0 : [1, 3, 6, 12, 20][index % 5],
    easeFactor: [2.1, 2.3, 2.5, 2.7][index % 4],
    masteryScore: mastery[index % mastery.length],
    confidenceScore: confidence[index % confidence.length],
    lapses: index % 9 === 0 ? 2 : index % 5 === 0 ? 1 : 0,
    reviewCount,
    lastReviewedAt: reviewCount === 0 ? undefined : ["2026-04-29T10:00:00.000Z", "2026-05-01T14:00:00.000Z"][index % 2],
  }
}

function makeCard(
  seed: CourseSeed,
  index: number,
  suffix: string,
  cardType: FlashcardType,
  prompt: string,
  answer: string,
  target:
    | { type: FlashcardSource["sourceTargetType"]; id: string; hash?: string; excerpt: string; relatedRecordId?: string }
    | undefined,
  language?: Language,
  extra?: Partial<Pick<Flashcard, "hint" | "explanation" | "tags" | "staleStatus" | "createdMethod" | "sourceWarning">> & {
    imageAssetId?: string
    clozeText?: string
  },
): { card: Flashcard; source?: FlashcardSource } {
  const schedule = scheduleForIndex(index)
  const cardId = `${seed.key}_card_${suffix}`
  const sourceWarning = extra?.sourceWarning ?? !target
  const card: Flashcard = {
    id: cardId,
    courseId: seed.id,
    cardType,
    prompt: {
      text: prompt,
      imageAssetId: extra?.imageAssetId,
      clozeText: extra?.clozeText,
    },
    answer: { text: answer, isTrue: cardType === "true_false" ? answer.toLowerCase() === "true" : undefined },
    explanation: extra?.explanation ?? "",
    hint: extra?.hint ?? "",
    sourceExcerpt: target?.excerpt ?? "",
    difficultyLevel: seed.difficultyLevel,
    tags: extra?.tags ?? [seed.subject.toLowerCase(), cardType],
    language: language ?? seed.mainLanguage,
    relatedAppendixRecordId: target?.relatedRecordId,
    sourceWarning,
    masteryScore: schedule.masteryScore,
    confidenceScore: schedule.confidenceScore,
    dueAt: schedule.dueAt,
    intervalDays: schedule.intervalDays,
    easeFactor: schedule.easeFactor,
    stability: Math.max(0, schedule.intervalDays / 3),
    difficulty: index % 4 === 0 ? 0.75 : 0.45,
    lapses: schedule.lapses,
    reviewCount: schedule.reviewCount,
    lastReviewedAt: schedule.lastReviewedAt,
    staleStatus: extra?.staleStatus ?? (index % 17 === 0 ? "needs_review" : index % 19 === 0 ? "stale" : "fresh"),
    createdMethod: extra?.createdMethod ?? (index % 7 === 0 ? "ai" : "manual"),
    userNotes: index % 8 === 0 ? "Demo note: revisit source before the exam." : "",
    createdAt: now,
    updatedAt: now,
  }

  return {
    card,
    source: target
      ? {
          id: `${cardId}_source`,
          flashcardId: cardId,
          sourceTargetType: target.type,
          sourceTargetId: target.id,
          sourceVersion: 1,
          sourceHash: target.hash,
          sourceExcerpt: target.excerpt,
          createdAt: now,
        }
      : undefined,
  }
}

function makeFlashcards(
  seed: CourseSeed,
  blocks: ContentBlock[],
  records: AppendixRecord[],
  assets: Asset[],
  subsectionSeeds: SubsectionSeed[],
): { cards: Flashcard[]; sources: FlashcardSource[] } {
  const cards: Flashcard[] = []
  const sources: FlashcardSource[] = []
  let index = 0

  subsectionSeeds.forEach((sub) => {
    const paragraph = blocks.find((block) => block.id === blockId(seed.key, `${sub.suffix}_paragraph`))
    const definition = blocks.find((block) => block.id === blockId(seed.key, `${sub.suffix}_definition`))
    const summary = blocks.find((block) => block.id === blockId(seed.key, `${sub.suffix}_summary`))
    const question = blocks.find((block) => block.id === blockId(seed.key, `${sub.suffix}_question`))
    const primaryRecordSuffix = sub.primaryRecordSuffix
    const relatedRecord = primaryRecordSuffix
      ? records.find((record) => record.id === recordId(seed.key, primaryRecordSuffix))
      : undefined

    const generated = [
      makeCard(
        seed,
        index++,
        `${sub.suffix}_basic`,
        "basic",
        `What is the main idea of ${sub.title}?`,
        sub.summary,
        paragraph && {
          type: "content_block",
          id: paragraph.id,
          hash: paragraph.contentHash,
          excerpt: paragraph.plainText.slice(0, 180),
          relatedRecordId: relatedRecord?.id,
        },
        sub.language,
        { hint: sub.topic, explanation: sub.example },
      ),
      makeCard(
        seed,
        index++,
        `${sub.suffix}_definition`,
        "definition",
        `Define ${sub.term}.`,
        sub.definition,
        definition && {
          type: "content_block",
          id: definition.id,
          hash: definition.contentHash,
          excerpt: definition.plainText,
          relatedRecordId: relatedRecord?.id,
        },
        sub.language,
        { tags: ["definition", seed.subject.toLowerCase()] },
      ),
      makeCard(
        seed,
        index++,
        `${sub.suffix}_cloze`,
        "cloze",
        `Fill in the blank: ${sub.summary.replace(/\b\w{7,}\b/, "_____")}`,
        sub.summary,
        summary && {
          type: "content_block",
          id: summary.id,
          hash: summary.contentHash,
          excerpt: summary.plainText,
          relatedRecordId: relatedRecord?.id,
        },
        sub.language,
        { clozeText: sub.summary, tags: ["cloze", seed.subject.toLowerCase()] },
      ),
      makeCard(
        seed,
        index++,
        `${sub.suffix}_true_false`,
        "true_false",
        `True or false: ${sub.question}`,
        index % 2 === 0 ? "True" : "False",
        question && {
          type: "content_block",
          id: question.id,
          hash: question.contentHash,
          excerpt: question.plainText,
          relatedRecordId: relatedRecord?.id,
        },
        sub.language,
        { explanation: `Check the source question for ${sub.topic}.` },
      ),
    ]

    generated.forEach(({ card, source }) => {
      cards.push(card)
      if (source) sources.push(source)
    })
  })

  const firstImageRecord = records.find((record) => record.recordType === "image")
  const firstImageAsset = assets.find((asset) => asset.assetType === "image")
  if (firstImageRecord && firstImageAsset) {
    const imageCard = makeCard(
      seed,
      index++,
      "image_recognition",
      "image",
      `Identify the study purpose of ${firstImageRecord.title}.`,
      firstImageRecord.shortDescription,
      {
        type: "asset",
        id: firstImageAsset.id,
        excerpt: firstImageRecord.shortDescription,
        relatedRecordId: firstImageRecord.id,
      },
      firstImageRecord.language,
      {
        imageAssetId: firstImageAsset.id,
        tags: ["image", "recognition"],
      },
    )
    cards.push(imageCard.card)
    if (imageCard.source) sources.push(imageCard.source)
  }

  const firstPerson = records.find((record) => record.recordType === "person")
  if (firstPerson) {
    const personCard = makeCard(
      seed,
      index++,
      "person_context",
      "person",
      `Why is ${firstPerson.title} important in this course?`,
      firstPerson.shortDescription,
      {
        type: "appendix_record",
        id: firstPerson.id,
        hash: firstPerson.recordHash,
        excerpt: firstPerson.shortDescription,
        relatedRecordId: firstPerson.id,
      },
      firstPerson.language,
      { tags: ["person", "appendix"] },
    )
    cards.push(personCard.card)
    if (personCard.source) sources.push(personCard.source)
  }

  const unlinked = makeCard(
    seed,
    index++,
    "unlinked_warning",
    "basic",
    `What source should be attached to this ${seed.subject} reminder?`,
    "This card intentionally has no source link so the warning state is visible.",
    undefined,
    seed.mainLanguage,
    {
      sourceWarning: true,
      staleStatus: "fresh",
      tags: ["unlinked", "demo"],
    },
  )
  cards.push(unlinked.card)

  return { cards, sources }
}

function makeSuggestions(
  seed: CourseSeed,
  blocks: ContentBlock[],
  records: AppendixRecord[],
): { suggestions: AiSuggestion[]; targets: AiSuggestionTarget[] } {
  const firstBlock = blocks.find((block) => block.blockType === "paragraph") ?? blocks[0]
  const firstRecord = records[0]
  const statuses: AiSuggestion["status"][] = ["pending", "deferred", "accepted", "rejected"]

  const suggestions = statuses.map<AiSuggestion>((status, index) => ({
    id: `${seed.key}_suggestion_${status}`,
    courseId: seed.id,
    suggestionType: index === 1 ? "appendix_items" : index === 2 ? "links" : index === 3 ? "study_plan" : "flashcards",
    status,
    title:
      status === "pending"
        ? `Generate review cards for ${seed.subject}`
        : status === "deferred"
          ? `Possible appendix cleanup for ${seed.subject}`
          : status === "accepted"
            ? `Accepted source-link suggestion`
            : `Rejected broad rewrite suggestion`,
    summary:
      status === "pending"
        ? `Suggested cards from ${firstBlock?.plainText.slice(0, 90) ?? "selected content"}.`
        : `Demo ${status} AI suggestion showing validation history.`,
    payload: {
      cards: [
        {
          cardType: "basic",
          prompt: `Explain one key idea from ${seed.title}.`,
          answer: firstBlock?.plainText.slice(0, 160) ?? seed.description,
          sourceTargetType: "content_block",
          sourceTargetId: firstBlock?.id,
        },
      ],
      safeMode: true,
    },
    model: "supabase-edge-function-ready",
    promptVersion: "mvp-expanded-demo",
    riskLevel: index === 3 ? "high" : index === 1 ? "medium" : "low",
    createdByContext: {
      targetType: index % 2 === 0 ? "content_block" : "appendix_record",
      sourceExcerpt: firstBlock?.plainText.slice(0, 220),
    },
    createdAt: now,
    resolvedAt: status === "pending" ? undefined : "2026-05-02T15:30:00.000Z",
  }))

  const targets = suggestions.map<AiSuggestionTarget>((suggestion, index) => ({
    id: `${suggestion.id}_target`,
    aiSuggestionId: suggestion.id,
    targetType: index % 2 === 0 ? "content_block" : "appendix_record",
    targetId: index % 2 === 0 ? firstBlock?.id ?? blocks[0].id : firstRecord?.id ?? records[0].id,
    targetVersion: 1,
    targetHash: index % 2 === 0 ? firstBlock?.contentHash : firstRecord?.recordHash,
  }))

  return { suggestions, targets }
}

function buildCourse(seed: CourseSeed): CourseBundle {
  const course = makeCourse(seed)
  const tables = makeTables(seed)
  const fields = makeFields(tables)
  const sources = makeSources(seed)
  const assets = makeAssets(seed)
  const { records, values } = makeRecords(seed, fields)
  const { nodes, blocks, subsectionSeeds } = makeNodesAndBlocks(seed)
  const { anchors, links } = makeAnchorsAndLinks(seed, blocks, records, assets)
  const flashcardBundle = makeFlashcards(seed, blocks, records, assets, subsectionSeeds)
  const suggestionBundle = makeSuggestions(seed, blocks, records)

  const assetLinks: EntityLink[] = flashcardBundle.cards
    .filter((card) => card.prompt.imageAssetId)
    .map((card) => ({
      id: `${card.id}_asset_link`,
      courseId: seed.id,
      fromType: "flashcard",
      fromId: card.id,
      toType: "asset",
      toId: card.prompt.imageAssetId!,
      linkType: "uses_image",
      metadata: {},
      createdMethod: "system",
      createdAt: now,
    }))

  return {
    course,
    nodes,
    blocks,
    anchors,
    tables,
    fields,
    records,
    values,
    sources,
    assets,
    flashcards: flashcardBundle.cards,
    flashcardSources: flashcardBundle.sources,
    entityLinks: [...links, ...assetLinks],
    suggestions: suggestionBundle.suggestions,
    suggestionTargets: suggestionBundle.targets,
  }
}

function makeReviewData(courses: Course[], flashcards: Flashcard[]): {
  sessions: ReviewSession[]
  attempts: ReviewAttempt[]
} {
  const sessions: ReviewSession[] = []
  const attempts: ReviewAttempt[] = []

  courses.forEach((course) => {
    const reviewedCards = flashcards
      .filter((card) => card.courseId === course.id && card.reviewCount > 0)
      .slice(0, 8)
    const session: ReviewSession = {
      id: `${course.id}_session_due_review`,
      courseId: course.id,
      userId: profileId,
      mode: "due",
      filters: { source: "expanded-demo" },
      startedAt: "2026-05-02T18:00:00.000Z",
      endedAt: "2026-05-02T18:24:00.000Z",
      durationSeconds: 1440,
      cardCount: reviewedCards.length,
    }
    sessions.push(session)

    reviewedCards.forEach((card, index) => {
      attempts.push({
        id: `${session.id}_attempt_${index + 1}`,
        reviewSessionId: session.id,
        flashcardId: card.id,
        userId: profileId,
        answerPayload: { text: index % 3 === 0 ? "partial answer" : card.answer.text },
        selfRating: [2, 3, 4, 5][index % 4],
        isCorrect: index % 3 !== 0,
        aiEvaluation:
          index % 4 === 0
            ? { verdict: "partially_correct", note: "Demo AI evaluation; user confirmed result." }
            : undefined,
        userConfirmedResult: true,
        responseTimeMs: 9000 + index * 1300,
        reviewedAt: `2026-05-02T18:${String(2 + index * 2).padStart(2, "0")}:00.000Z`,
      })
    })
  })

  return { sessions, attempts }
}

function computeMetrics(courses: Course[], blocks: ContentBlock[], records: AppendixRecord[], cards: Flashcard[], sources: FlashcardSource[]): CourseMetrics[] {
  return courses.map((course) => {
    const courseBlocks = blocks.filter((block) => block.courseId === course.id)
    const blockText = courseBlocks.map((block) => block.plainText).join(" ")
    const courseCards = cards.filter((card) => card.courseId === course.id)
    const courseRecords = records.filter((record) => record.courseId === course.id)
    const sourceLinkedBlockIds = new Set(
      sources
        .filter((source) => source.sourceTargetType === "content_block")
        .map((source) => source.sourceTargetId),
    )
    const words = blockText.match(/\b[\w'-]+\b/g) ?? []
    const sentences = blockText.split(/(?<=[.!?])\s+/).filter(Boolean)
    const coveredBlocks = courseBlocks.filter((block) => sourceLinkedBlockIds.has(block.id)).length

    return {
      courseId: course.id,
      wordCount: words.length,
      characterCount: blockText.length,
      sentenceCount: sentences.length,
      headingCount: courseBlocks.filter((block) => block.blockType === "heading").length,
      contentBlockCount: courseBlocks.length,
      appendixRecordCount: courseRecords.length,
      flashcardCount: courseCards.length,
      tokenEstimate: Math.round(words.length * 1.35),
      dueCardCount: courseCards.filter((card) => new Date(card.dueAt).getTime() <= demoToday.getTime()).length,
      weakCardCount: courseCards.filter((card) => card.masteryScore < 55 || card.confidenceScore < 50 || card.lapses >= 2).length,
      coveragePercent: courseBlocks.length ? Math.round((coveredBlocks / courseBlocks.length) * 100) : 0,
      updatedAt: now,
    }
  })
}

const bundles = courseSeeds.map(buildCourse)
const courses = bundles.map((bundle) => bundle.course)
const courseNodes = bundles.flatMap((bundle) => bundle.nodes)
const contentBlocks = bundles.flatMap((bundle) => bundle.blocks)
const contentBlockVersions: ContentBlockVersion[] = []
const contentTextAnchors = bundles.flatMap((bundle) => bundle.anchors)
const appendixTables = bundles.flatMap((bundle) => bundle.tables)
const appendixFields = bundles.flatMap((bundle) => bundle.fields)
const appendixRecords = bundles.flatMap((bundle) => bundle.records)
const appendixRecordValues = bundles.flatMap((bundle) => bundle.values)
const sources = bundles.flatMap((bundle) => bundle.sources)
const assets = bundles.flatMap((bundle) => bundle.assets)
const flashcards = bundles.flatMap((bundle) => bundle.flashcards)
const flashcardSources = bundles.flatMap((bundle) => bundle.flashcardSources)
const entityLinks = bundles.flatMap((bundle) => bundle.entityLinks)
const aiSuggestions = bundles.flatMap((bundle) => bundle.suggestions)
const aiSuggestionTargets = bundles.flatMap((bundle) => bundle.suggestionTargets)
const studySchedules: StudySchedule[] = []
const tags: Tag[] = []
const taggings: Tagging[] = []
const reviewData = makeReviewData(courses, flashcards)
const metrics = computeMetrics(courses, contentBlocks, appendixRecords, flashcards, flashcardSources)

export const defaultStudyData: StudyData = {
  profileId,
  courses,
  courseNodes,
  contentBlocks,
  contentBlockVersions,
  contentTextAnchors,
  appendixTables,
  appendixFields,
  appendixRecords,
  appendixRecordValues,
  sources,
  assets,
  flashcards,
  flashcardSources,
  reviewSessions: reviewData.sessions,
  reviewAttempts: reviewData.attempts,
  studySchedules,
  aiSuggestions,
  aiSuggestionTargets,
  entityLinks,
  tags,
  taggings,
  metrics,
}
