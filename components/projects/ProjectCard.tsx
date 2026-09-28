export interface Project {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription?: string;
  category: string;
  status: string;
  website?: string;
  github?: string;
  demo?: string;
  docs?: string;
  image?: string;
  tags: string[];
  featured?: boolean;
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="glass-card rounded-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold">{project.name}</h3>
        <span className="whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary">
          {project.status}
        </span>
      </div>
      <p className="text-sm text-text-secondary">{project.shortDescription}</p>
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
          >
            Live Website
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3 py-1.5 text-xs"
          >
            GitHub
          </a>
        )}
        {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3 py-1.5 text-xs"
          >
            Demo
          </a>
        )}
        {project.docs && (
          <a
            href={project.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3 py-1.5 text-xs"
          >
            Docs
          </a>
        )}
      </div>
    </article>
  );
}
