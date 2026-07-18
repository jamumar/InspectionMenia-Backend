import { mockReports, createDefaultSections } from "../models/mockData.js";

// In-memory array acting as our database
let reports = [...mockReports];

/**
 * @desc    Get all reports
 * @route   GET /api/reports
 * @access  Public
 */
export const getReports = (req, res) => {
  res.json(reports);
};

/**
 * @desc    Get single report by ID
 * @route   GET /api/reports/:id
 * @access  Public
 */
export const getReportById = (req, res) => {
  const report = reports.find((r) => r.id === req.params.id);

  if (report) {
    res.json(report);
  } else {
    res.status(404);
    throw new Error("Report not found");
  }
};

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Public
 */
export const createReport = (req, res) => {
  const { name, address, surveyorName, companyName, isImported, sourceFileName } = req.body;

  const newReport = {
    id: `rep_${Date.now()}`,
    name,
    address,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    status: "Draft",
    isImported: !!isImported,
    sourceFileName: sourceFileName || null,
    userProfile: {
      name: surveyorName || "James Carter",
      role: "Senior Inspector",
      initials: (surveyorName || "James Carter").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    },
    sections: createDefaultSections()
  };

  reports.push(newReport);
  res.status(201).json(newReport);
};

/**
 * @desc    Update a report
 * @route   PUT /api/reports/:id
 * @access  Public
 */
export const updateReport = (req, res) => {
  const { name, address, status } = req.body;
  const reportIndex = reports.findIndex((r) => r.id === req.params.id);

  if (reportIndex !== -1) {
    const updatedReport = {
      ...reports[reportIndex],
      name: name || reports[reportIndex].name,
      address: address || reports[reportIndex].address,
      status: status || reports[reportIndex].status,
    };

    reports[reportIndex] = updatedReport;
    res.json(updatedReport);
  } else {
    res.status(404);
    throw new Error("Report not found");
  }
};

/**
 * @desc    Delete a report
 * @route   DELETE /api/reports/:id
 * @access  Public
 */
export const deleteReport = (req, res) => {
  const reportIndex = reports.findIndex((r) => r.id === req.params.id);

  if (reportIndex !== -1) {
    reports = reports.filter((r) => r.id !== req.params.id);
    res.json({ message: "Report removed successfully" });
  } else {
    res.status(404);
    throw new Error("Report not found");
  }
};

/**
 * @desc    Update a specific section within a report
 * @route   PUT /api/reports/:id/sections/:sectionId
 * @access  Public
 */
export const updateReportSection = (req, res) => {
  const { id, sectionId } = req.params;
  const { fields, content, photoEvidenceOnly, aiImages, photoImages, status, isEdited } = req.body;

  const reportIndex = reports.findIndex((r) => r.id === id);

  if (reportIndex === -1) {
    res.status(404);
    throw new Error("Report not found");
  }

  const report = reports[reportIndex];
  const section = report.sections[sectionId];

  if (!section) {
    res.status(404);
    throw new Error(`Section ${sectionId} not found in this report`);
  }

  // Update fields/content and recalculate section status
  const updatedSection = {
    ...section,
    photoEvidenceOnly: photoEvidenceOnly !== undefined ? photoEvidenceOnly : section.photoEvidenceOnly,
    aiImages: aiImages || section.aiImages,
    photoImages: photoImages || section.photoImages,
    isEdited: isEdited !== undefined ? isEdited : section.isEdited,
  };

  if (fields) {
    updatedSection.fields = { ...section.fields, ...fields };
  }
  if (content) {
    updatedSection.content = content;
  }

  // Calculate status if not directly provided
  if (status) {
    updatedSection.status = status;
  } else {
    let hasValues = false;
    let allFilled = true;

    if (updatedSection.fields) {
      hasValues = Object.values(updatedSection.fields).some(val => val && val.trim() !== "");
      allFilled = Object.values(updatedSection.fields).every(val => val && val.trim() !== "");
    } else if (updatedSection.content) {
      hasValues = Array.isArray(updatedSection.content) 
        ? updatedSection.content.some(p => p && p.trim() !== "") 
        : updatedSection.content.trim() !== "";
      allFilled = hasValues;
    }

    if (!hasValues) {
      updatedSection.status = "Empty";
    } else if (allFilled) {
      updatedSection.status = "Completed";
    } else {
      updatedSection.status = "In Progress";
    }
  }

  // Save back to in-memory store
  reports[reportIndex].sections[sectionId] = updatedSection;
  res.json(updatedSection);
};
