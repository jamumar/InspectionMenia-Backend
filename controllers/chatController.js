import { mockChatHistory, mockPromptResponses } from "../models/mockData.js";

let chatHistory = [...mockChatHistory];

/**
 * @desc    Get chat logs
 * @route   GET /api/chat
 * @access  Public
 */
export const getChatHistory = (req, res) => {
  res.json(chatHistory);
};

/**
 * @desc    Send user message and receive AI reply
 * @route   POST /api/chat
 * @access  Public
 */
export const sendChatMessage = (req, res) => {
  const { message } = req.body;

  const userMsg = {
    id: `msg_u_${Date.now()}`,
    sender: "user",
    text: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  chatHistory.push(userMsg);

  // Match suggestion keywords or default reply
  const normalized = message.toLowerCase().trim();
  let replyText = "I've analyzed your request. I can help refine this report. What specific edits would you like me to make?";
  
  if (normalized.includes("professionally") || normalized.includes("rewrite")) {
    replyText = mockPromptResponses["rewrite professionally"];
  } else if (normalized.includes("shorten") || normalized.includes("concise")) {
    replyText = mockPromptResponses["shorten response"];
  } else if (normalized.includes("explain defect") || normalized.includes("why")) {
    replyText = mockPromptResponses["explain defect"];
  } else if (normalized.includes("recommendation") || normalized.includes("remedial")) {
    replyText = mockPromptResponses["improve recommendation"];
  }

  const aiMsg = {
    id: `msg_a_${Date.now()}`,
    sender: "assistant",
    text: replyText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  chatHistory.push(aiMsg);

  res.status(201).json({
    userMessage: userMsg,
    aiMessage: aiMsg
  });
};

/**
 * @desc    AI section content generation proxy
 * @route   POST /api/chat/generate-section
 * @access  Public
 */
export const generateSectionContent = (req, res) => {
  const { sectionId, title } = req.body;

  if (!sectionId) {
    res.status(400);
    throw new Error("sectionId is required");
  }

  // Generate customized fields based on the section title/ID
  let element = `Standard element relating to ${title || sectionId}`;
  let defect = `AI-Detected wear and degradation within the ${title || sectionId} assembly. Plaster crack patterns indicate mild loading stress.`;
  let remedial = `Instruct a specialized building contractor to inspect the structural details of the ${title || sectionId} and repair localized defects.`;
  let consequences = `Continued deterioration of ${title || sectionId} will lead to moisture penetration and timber rot inside the sub-frame.`;

  if (sectionId === "E1") {
    element = "Concrete interlocking roof tiles";
    defect = "Several concrete interlocking tiles along the south-facing elevation exhibit cracking and displacement. Additionally, ridge tiles display evidence of mortar deterioration, with visible gaps at junction points.";
    remedial = "A qualified roofing contractor should be engaged to replace cracked tiles and re-bed the ridge tiles.";
    consequences = "If left unrepaired, water ingress will occur, causing rot to structural roof timbers and damage to interior ceilings.";
  } else if (sectionId === "E2") {
    element = "Timber roof joists and support rafter assembly";
    defect = "Localized water dampness staining observed on structural timber rafters adjacent to the chimney stack, though no live timber rot is currently apparent.";
    remedial = "Rake out damp areas, seal the leakage source from the roof covering, and apply wood preservative treatments.";
    consequences = "Unchecked water entry will lead to structural rot, rafters deflection, and eventual ceiling collapse.";
  } else if (sectionId === "F3") {
    element = "Interior dry-lined brick partition walls";
    defect = "Fine diagonal hairline cracking noted in the plasterwork finish above the kitchen entrance frame, measuring approximately 1.5mm in width.";
    remedial = "Monitor the cracks over 6 months; rake out plaster, apply reinforced scrim tape, and skim plaster flush before re-decorating.";
    consequences = "Cosmetic finishes will remain unsightly and crumbly, though no structural stability issues are indicated.";
  }

  res.json({
    fields: { element, defect, remedial, consequences }
  });
};
