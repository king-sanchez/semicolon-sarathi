const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const schemes = [
  {
    schemeName: "PM Kisan Samman Nidhi",
    description: "Financial support to farmers",
    benefits: "₹6000 per year in three installments",
    eligibilityRules: {
      occupation: "Farmer",
      maxIncome: 200000
    },
    applicationUrl: "https://pmkisan.gov.in/",
    requiredDocuments: "Aadhaar, Bank Account, Land Records",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "Pradhan Mantri Awas Yojana",
    description: "Housing for all",
    benefits: "Subsidy on home loans and direct assistance",
    eligibilityRules: {
      maxIncome: 1800000
    },
    applicationUrl: "https://pmaymis.gov.in/",
    requiredDocuments: "Income Certificate, Aadhaar, Bank Account",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "Ayushman Bharat",
    description: "Health insurance scheme",
    benefits: "₹5 lakh health cover per family per year",
    eligibilityRules: {
      maxIncome: 100000
    },
    applicationUrl: "https://pmjay.gov.in/",
    requiredDocuments: "Aadhaar, Ration Card",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "National Pension Scheme",
    description: "Pension scheme for all citizens",
    benefits: "Pension after retirement",
    eligibilityRules: {
      minAge: 18,
      maxAge: 70
    },
    applicationUrl: "https://www.npscra.nsdl.co.in/",
    requiredDocuments: "Aadhaar, PAN, Bank Account",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "PM Scholarship Scheme",
    description: "Scholarship for students",
    benefits: "₹2500-3000 per month",
    eligibilityRules: {
      minAge: 18,
      maxAge: 25,
      maxIncome: 600000
    },
    applicationUrl: "https://scholarships.gov.in/",
    requiredDocuments: "Aadhaar, Income Certificate, Educational Documents",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "Kanyashree Prakalpa",
    description: "Scholarship for girls in West Bengal",
    benefits: "Annual scholarship for girl students",
    eligibilityRules: {
      gender: "Female",
      state: "West Bengal",
      minAge: 13,
      maxAge: 19
    },
    applicationUrl: "https://wbkanyashree.gov.in/",
    requiredDocuments: "Aadhaar, School Certificate, Bank Account",
    schemeType: "state",
    state: "West Bengal"
  },
  {
    schemeName: "Krishi Unnati Yojana",
    description: "Agricultural development scheme",
    benefits: "Training and financial support for farmers",
    eligibilityRules: {
      occupation: "Farmer"
    },
    applicationUrl: "https://agricoop.nic.in/",
    requiredDocuments: "Land Records, Aadhaar, Bank Account",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "SC/ST Scholarship",
    description: "Scholarship for SC/ST students",
    benefits: "Educational financial assistance",
    eligibilityRules: {
      category: "SC"
    },
    applicationUrl: "https://scholarships.gov.in/",
    requiredDocuments: "Caste Certificate, Aadhaar, Educational Documents",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "OBC Scholarship",
    description: "Scholarship for OBC students",
    benefits: "Educational financial assistance",
    eligibilityRules: {
      category: "OBC",
      maxIncome: 800000
    },
    applicationUrl: "https://scholarships.gov.in/",
    requiredDocuments: "Caste Certificate, Income Certificate, Aadhaar",
    schemeType: "central",
    state: null
  },
  {
    schemeName: "EWS Scholarship",
    description: "Scholarship for Economically Weaker Sections",
    benefits: "Educational financial assistance",
    eligibilityRules: {
      category: "EWS",
      maxIncome: 800000
    },
    applicationUrl: "https://scholarships.gov.in/",
    requiredDocuments: "EWS Certificate, Income Certificate, Aadhaar",
    schemeType: "central",
    state: null
  }
];

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.scheme.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  // Insert schemes
  for (const scheme of schemes) {
    await prisma.scheme.create({
      data: scheme
    });
  }

  console.log(`Seeded ${schemes.length} schemes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

//  
