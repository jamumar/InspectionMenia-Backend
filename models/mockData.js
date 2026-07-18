// Mock Database Models and Seed Data for backend

const CATEGORIES = {
  E: "EXTERIOR",
  F: "INTERIOR",
  G: "SERVICES",
  H: "GROUNDS",
  I: "LEGAL",
  J: "RISKS",
  K: "ENERGY"
};

const SECTION_TITLES = {
  E1: "Chimney Stacks",
  E2: "Roof Coverings",
  E3: "Rainwater Pipes and Gutters",
  E4: "Main Walls",
  E5: "Windows",
  E6: "Outside Doors (including patio doors)",
  E7: "Conservatories and Porches",
  E8: "Other Joinery and Finishes",
  E9: "Other",
  F1: "Roof Structure",
  F2: "Ceilings",
  F3: "Walls and Partitions",
  F4: "Floors",
  F5: "Fireplaces, Chimneys and Breasts",
  F6: "Built-in Fittings",
  F7: "Woodwork",
  F8: "Bathroom Fittings",
  F9: "Other",
  G1: "Electricity",
  G2: "Gas/oil",
  G3: "Water",
  G4: "Heating",
  G5: "Water Heating",
  G6: "Drainage",
  G7: "Common Services",
  G8: "Other",
  H1: "Garage",
  H2: "Other Outbuildings and Yard Structures",
  H3: "General Grounds",
  I1: "Regulation",
  I2: "Guarantees",
  I3: "Other matters",
  J1: "Risks to the building",
  J2: "Risks to the grounds",
  J3: "Risks to people",
  J4: "Other risks or hazards",
  K1: "Insulation",
  K2: "Heating",
  K3: "Lighting",
  K4: "Ventilation",
  K5: "General"
};

export function createDefaultSections() {
  const sections = {};
  Object.entries(SECTION_TITLES).forEach(([id, title]) => {
    const prefix = id.charAt(0);
    const category = CATEGORIES[prefix] || "OTHER";
    
    let type = "info";
    if (["E", "F"].includes(prefix)) {
      type = "ai-enabled";
    } else if (["G", "H"].includes(prefix)) {
      type = "photo-only";
    }

    if (type === "ai-enabled") {
      sections[id] = {
        id,
        title,
        category,
        type,
        status: "Empty",
        photoEvidenceOnly: false,
        aiImages: [],
        photoImages: [],
        fields: { element: "", defect: "", remedial: "", consequences: "" }
      };
    } else if (type === "photo-only") {
      sections[id] = {
        id,
        title,
        category,
        type,
        status: "Empty",
        photoImages: []
      };
    } else {
      sections[id] = {
        id,
        title,
        category,
        type,
        status: "Empty",
        content: []
      };
    }
  });
  return sections;
}

// Oakwood Residence
const rep1Sections = createDefaultSections();
rep1Sections.E1.status = "Completed";
rep1Sections.E1.fields = {
  element: "Brick masonry chimney stack",
  defect: "No major defects identified. The mortar pointing is intact and flashings appear secure.",
  remedial: "None required at this time. Standard monitoring advised.",
  consequences: "None. Stack is functional."
};
rep1Sections.E2.status = "In Progress";
rep1Sections.E2.aiImages = ["img_roof_1"];
rep1Sections.E2.photoImages = ["img_roof_2"];
rep1Sections.E2.fields = {
  element: "Concrete interlocking roof tiles",
  defect: "Several concrete interlocking tiles along the south-facing elevation exhibit cracking and displacement. Additionally, ridge tiles display evidence of mortar deterioration, with visible gaps at junction points.",
  remedial: "A qualified roofing contractor should be engaged to replace cracked tiles and re-bed the ridge tiles.",
  consequences: "If left unrepaired, water ingress will occur, causing rot to the structural roof timbers and damage to interior ceilings."
};
rep1Sections.E3.status = "In Progress";
rep1Sections.E3.aiImages = ["img_roof_3"];
rep1Sections.E3.fields = {
  element: "uPVC half-round gutters and downpipes",
  defect: "The gutters are heavily blocked with leaf debris and silt on the eastern side.",
  remedial: "Clear debris and flush the system to ensure smooth discharge.",
  consequences: "Overflowing rainwater could saturate the main walls, leading to localized dampness internally."
};
rep1Sections.F8.status = "Completed";
rep1Sections.F8.photoImages = ["img_bath_1"];
rep1Sections.F8.fields = {
  element: "Bathroom shower tray and enclosure",
  defect: "Silicon seal at the base of the shower enclosure is mouldy and failing in corners, allowing micro-leaks.",
  remedial: "Remove existing sealant, sanitize joint, and re-apply sealant.",
  consequences: "Leaks will damage timber framing and ceilings below."
};
rep1Sections.H3.status = "In Progress";
rep1Sections.H3.photoImages = ["img_walls_1"];

// Maple Grove Common
const rep2Sections = createDefaultSections();
Object.keys(rep2Sections).forEach(key => {
  rep2Sections[key].status = "Completed";
});
rep2Sections.E2.fields = { element: "Asphalt shingles", defect: "Minor moss growth on north shingles.", remedial: "Apply chemical cleaning agent.", consequences: "Premature surface erosion if neglected." };
rep2Sections.F1.fields = { element: "Trusses", defect: "None visible.", remedial: "None.", consequences: "None." };

// Riverside Apartments
const rep3Sections = createDefaultSections();
rep3Sections.E2.status = "Completed";
rep3Sections.E2.fields = { element: "Flat roof membrane", defect: "Standing water and blistering noted.", remedial: "Cut out blister and apply patch.", consequences: "Will rot substrate structural decks." };
rep3Sections.F1.status = "Completed";
rep3Sections.F1.fields = { element: "Timber joists", defect: "Damp spots found around blistering.", remedial: "Investigate deck and reinforce joist if rotted.", consequences: "Loss of deck loading strength." };

// Mock In-Memory DB
export const mockReports = [
  {
    id: "rep_1",
    name: "Oakwood Residence",
    address: "123 Oakwood Drive, Portland, OR 97201",
    date: "Jul 2, 2025",
    status: "Draft",
    userProfile: {
      name: "James Carter",
      role: "Senior Inspector",
      initials: "JC"
    },
    sections: rep1Sections
  },
  {
    id: "rep_2",
    name: "Maple Grove Common",
    address: "455 Maple Street, Seattle, WA 98101",
    date: "Jun 28, 2025",
    status: "Completed",
    userProfile: {
      name: "James Carter",
      role: "Senior Inspector",
      initials: "JC"
    },
    sections: rep2Sections
  },
  {
    id: "rep_3",
    name: "Riverside Apartments",
    address: "78 Riverbank Road, Tacoma, WA 98402",
    date: "Jun 21, 2025",
    status: "Draft",
    userProfile: {
      name: "James Carter",
      role: "Senior Inspector",
      initials: "JC"
    },
    sections: rep3Sections
  }
];

export const mockChatHistory = [
  {
    id: "msg_1",
    sender: "assistant",
    text: "Hello! I am your InspectSafe AI Assistant. I can help you draft, review, or polish your inspection reports. You can select any section and ask me to write descriptions, explain defects, or make recommendations.",
    timestamp: "10:00 AM"
  },
  {
    id: "msg_2",
    sender: "user",
    text: "Can you rewrite the roof covering defect section to be more professional?",
    timestamp: "10:05 AM"
  },
  {
    id: "msg_3",
    sender: "assistant",
    text: "Here is a revised, more professional version:\n\n*\"Several concrete interlocking tiles along the south-facing elevation exhibit cracking and displacement. Additionally, ridge tiles display evidence of mortar deterioration, with visible gaps at junction points. We recommend a thorough inspection by a licensed roofing contractor to assess the full extent of the defect.\"*\n\nWould you like me to shorten this or adjust the tone further?",
    timestamp: "10:06 AM"
  }
];

export const mockPromptResponses = {
  "rewrite professionally": "Here is a revised, more professional version:\n\n*\"The inspected elements demonstrate clear indicators of wear and accelerated aging, which is inconsistent with standard performance thresholds. Specifically, localized fractures and displacement have compromised the outer weathering layer. A qualified specialist should be engaged to perform repairs and reinstate full watertightness.\"*",
  
  "shorten response": "Here is a more concise version:\n\n*\"Cracked and displaced tiles observed on the south roof slope, alongside mortar degradation at the ridge. Recommending specialist contractor review and repair.\"*",
  
  "explain defect": "Here is an explanation of the defect:\n\n*\"Cracking and displacement in concrete tiles is typically caused by thermal expansion, structural settlement, or impacts. Over time, the deterioration of the bedding mortar allows tiles to loosen. This compromises the weathering envelope, leading to water ingress, timber decay in the rafters, and potential ceiling damage below.\"*",
  
  "improve recommendation": "Here is an improved, actionable recommendation:\n\n*\"Instruct a RICS-registered building contractor or licensed roofer to examine the roof covering. Remount and replace all cracked/slipped concrete tiles, rake out deteriorated mortar, and re-bed the ridge tiles with high-durability polymer mortar. Ensure all flashing junctions are cleared and checked for watertightness within the next 3 months to prevent water penetration.\"*"
};
