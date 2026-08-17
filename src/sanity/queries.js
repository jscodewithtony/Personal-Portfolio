// GROQ queries, one per document type this site reads. Kept as plain
// exported strings (rather than building them ad hoc in components) so
// every consumer of a given document type stays in sync if a field is
// renamed.

export const navigationQuery = /* groq */ `*[_type == "navigation"][0]{
  items[]{ label, link }
}`;

export const homepageContentQuery = /* groq */ `*[_type == "homepageContent"][0]{
  heroHeadline,
  heroBasedInLocation,
  heroTagline,
  heroSpecs,
  heroBadgeLine1,
  heroBadgeLine2,
  aboutBodyParagraph1,
  aboutBodyParagraph2,
  statementHeadline,
  statementTrailingLine
}`;

export const aboutPageQuery = /* groq */ `*[_type == "aboutPage"][0]{
  scrollingTicker,
  heroHeadline,
  introParagraph,
  narrativeImageOne,
  narrativeImageOneAlt,
  narrativeImageTwo,
  narrativeImageTwoAlt,
  leftText,
  rightText,
  portraitImage,
  portraitImageAlt,
  portraitCaption,
  portraitSubCaption,
  philosophyLabel,
  philosophyText,
  philosophyHeadline,
  experienceHeading,
  experienceEntries[]{ year, description },
  experienceBackgroundImage,
  experienceBackgroundImageAlt,
  knowMoreHeadline,
  annotationDots[]{ label, tooltipText },
  personalParagraphOne,
  personalParagraphTwo,
  exploringIndiaHeadline,
  exploringIndiaText,
  travelPhotoCollage[]{ ... },
  closingHeadlineOne,
  closingHeadlineTwo,
  ctaEyebrow,
  contactEmail,
  ctaButtonLabel,
  ctaButtonLink
}`;

export const projectsQuery = /* groq */ `*[_type == "project"] | order(displayOrder asc){
  _id,
  title,
  client,
  "slug": slug.current,
  mainImage,
  thumbnailImage,
  shortDescription,
  industry,
  role,
  displayOrder,
  externalLink
}`;

export const projectBySlugQuery = /* groq */ `*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  client,
  "slug": slug.current,
  mainImage,
  thumbnailImage,
  shortDescription,
  industry,
  role,
  externalLink,
  timeline,
  tools,
  overviewParagraphs,
  outcomeStats,
  caseStudyBody,
  "nextProject": coalesce(
    *[_type == "project" && displayOrder > ^.displayOrder] | order(displayOrder asc)[0]{
      title, "slug": slug.current, mainImage, client
    },
    *[_type == "project" && _id != ^._id] | order(displayOrder asc)[0]{
      title, "slug": slug.current, mainImage, client
    }
  )
}`;

export const statCardsQuery = /* groq */ `*[_type == "statCard"] | order(displayOrder asc){
  _id,
  label,
  value,
  title,
  description,
  displayOrder
}`;

export const testimonialsQuery = /* groq */ `*[_type == "testimonial"] | order(displayOrder asc){
  _id,
  quote,
  name,
  role,
  sourcePlatform,
  sourceLogo,
  displayOrder
}`;

export const articlesQuery = /* groq */ `*[_type == "article"] | order(displayOrder asc){
  _id,
  title,
  excerpt,
  publishDate,
  thumbnail,
  externalLink,
  sourcePlatform,
  displayOrder
}`;

export const activeThemeQuery = /* groq */ `*[_type == "siteSettings"][0]{
  selectedTheme->{
    name,
    "primaryAccent": primaryAccent.hex,
    "primaryAccentHover": primaryAccentHover.hex,
    "backgroundColor": backgroundColor.hex,
    "textColor": textColor.hex,
    "statValueColor": statValueColor.hex,
    "statsCubeFrontColor": statsCubeFrontColor.hex,
    "statsCubeSideColor": statsCubeSideColor.hex,
    "statsCubeLineColor": statsCubeLineColor.hex
  }
}`;
