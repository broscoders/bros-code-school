import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import WebsitePage from "../models/WebsitePage";
import School from "../models/School";

const VALID_PAGE_TYPES = ["HOME", "ABOUT", "ADMISSIONS", "EVENTS", "GALLERY", "CONTACT", "FAQ"];

// Admin: list every page for this school, any status (draft or published).
export const getWebsitePages = async (req: AuthRequest, res: Response) => {
  try {
    const pages = await WebsitePage.find({ schoolId: req.user!.schoolId }).sort({ pageType: 1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Admin: create or update a page's content. This never changes its
// publish status by itself - saving edits to an already-published page
// keeps it published (and live) with the new content; a separate explicit
// publish/unpublish action controls visibility.
export const saveWebsitePage = async (req: AuthRequest, res: Response) => {
  try {
    const { pageType, title, sections } = req.body;
    if (!VALID_PAGE_TYPES.includes(pageType)) {
      return res.status(400).json({ message: "Invalid page type" });
    }
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const page = await WebsitePage.findOneAndUpdate(
      { schoolId: req.user!.schoolId, pageType },
      {
        title,
        sections: Array.isArray(sections) ? sections : [],
        updatedBy: req.user!.userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Admin only (route-level restriction to SCHOOL_ADMIN/PRINCIPAL) - the
// blueprint explicitly calls out that ordinary teachers must not be able to
// publish official school content.
export const setWebsitePageStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["DRAFT", "PUBLISHED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const page = await WebsitePage.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      {
        status,
        ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
      },
      { new: true }
    );
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Admin: assign/change this school's public site slug (e.g. "springfield-high").
export const setWebsiteSlug = async (req: AuthRequest, res: Response) => {
  try {
    const slug = (req.body.slug as string || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) return res.status(400).json({ message: "A valid slug is required" });

    const clash = await School.findOne({ slug, _id: { $ne: req.user!.schoolId } });
    if (clash) return res.status(400).json({ message: "This web address is already taken. Please choose another." });

    const school = await School.findByIdAndUpdate(req.user!.schoolId, { slug }, { new: true });
    res.json({ slug: school?.slug });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Public, no login required: renders the published site for one school.
// Only PUBLISHED pages and only the handful of fields a visitor should see
// are returned - never internal ids beyond what's needed, never draft
// content, never anything from other modules.
export const getPublicSite = async (req: Request, res: Response) => {
  try {
    const school = await School.findOne({ slug: req.params.slug, isActive: true }).select("name logoUrl primaryColor secondaryColor contactEmail contactPhone address");
    if (!school) return res.status(404).json({ message: "Site not found" });

    const pages = await WebsitePage.find({ schoolId: school._id, status: "PUBLISHED" })
      .select("pageType title sections publishedAt")
      .sort({ pageType: 1 });

    res.json({
      school: {
        name: school.name,
        logoUrl: school.logoUrl,
        primaryColor: school.primaryColor,
        secondaryColor: school.secondaryColor,
        contactEmail: school.contactEmail,
        contactPhone: school.contactPhone,
        address: school.address,
      },
      pages,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
