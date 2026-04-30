active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/45 hover:border-white/25 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-6 text-sm text-amber-100">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-amber-300/10"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-10 text-sm text-white/55">
          Loading saved comparisons...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-white/25" />
          <h2 className="mt-4 text-xl font-bold text-white">No matching comparisons</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
            Run a comparison from the homepage, then return here to manage its visibility and public report.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ComparisonRow
              key={item.id}
              item={item}
              isPublishing={publishingId === item.id}
              onPublish={() => void publish(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
    <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/35">
      {label}
    </p>
    <p className="mt-3 text-3xl font-black text-white">{value}</p>
  </div>
);

const jobToHistoryItem = (job: ComparisonJob): ComparisonHistoryItem => ({
  id: job.id,
  query: job.query,
  slug: job.result?.slug || slugFromQuery(job.query),
  status: job.status,
  visibility: "private",
  sourceCount: job.result?.sourceCount || 0,
  progress: job.progress,
  updatedAt: new Date().toISOString(),
  summary: job.result?.verdict.summary || null,
  entityA: job.result?.entities.a.name || null,
  entityB: job.result?.entities.b.name || null,
});

const slugFromQuery = (query: string) => {
  const [left, rest = "comparison"] = query.split(/\s+vs\.?\s+/i);
  const [right] = rest.split(/\s+for\s+/i);
  return `${left || "comparison"}-vs-${right || "target"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const ComparisonRow = ({
  item,
  isPublishing,
  onPublish,
}: {
  item: ComparisonHistoryItem;
  isPublishing: boolean;
  onPublish: () => void;
}) => {
  const StatusIcon = statusIcon[item.status];
  const VisibilityIcon = visibilityIcon[item.visibility];
  const title = [item.entityA, item.entityB].filter(Boolean).join(" vs ") || item.query;

  return (
    <article className="rounded-[28px] border border-white/10 bg-black/30 p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClass[item.status]}`}>
              <StatusIcon className={`h-3.5 w-3.5 ${item.status === "running" ? "animate-spin" : ""}`} />
              {item.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              <VisibilityIcon className="h-3.5 w-3.5" />
              {item.visibility}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-white/45">{item.query}</p>

          {item.summary && (
            <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-relaxed text-white/60">
              {item.summary}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-white/35">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTimestamp(item.updatedAt)}
            </span>
            <span>{item.sourceCount} sources</span>
            <span>{item.progress}% complete</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            to={`/app/comparisons/${item.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-[#e0e0e0]"
          >
            Review
          </Link>
          {item.visibility === "public" ? (
            <Link
              to={`/compare/${item.slug}`}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={item.status !== "completed" || isPublishing}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-orange-500/40 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPublishing ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              Publish
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ComparisonsPage;