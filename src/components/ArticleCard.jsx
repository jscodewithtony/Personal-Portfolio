// Reusable article/blog preview card for the Insight section. Takes a
// single `article` object so new posts (from Medium, LinkedIn, or
// anywhere else) can be added to the INSIGHT_ARTICLES list in
// Insight.jsx without touching this component or its layout.
function ArticleCard({ article }) {
  const { title, excerpt, date, image, href, source } = article;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-5 outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:-translate-y-1"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {source && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {source}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-base text-ink/60 dark:text-white/60 sm:text-lg">
          {date}
        </p>
        <h3 className="font-display text-xl font-bold uppercase leading-[1.1] tracking-tight text-ink dark:text-white transition-colors duration-300 group-hover:text-ink/80 dark:group-hover:text-white/80 sm:text-2xl">
          {title}
        </h3>
        <p className="line-clamp-3 font-display text-base leading-relaxed text-ink/60 dark:text-white/60 sm:text-lg">
          {excerpt}
        </p>
      </div>
    </a>
  );
}

export default ArticleCard;
