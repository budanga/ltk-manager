import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { useMemo, useState } from "react";
import {
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuImage,
  LuPencil,
  LuPlus,
  LuSave,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { twMerge } from "tailwind-merge";

import {
  Button,
  FormField,
  IconButton,
  MultiSelect,
  type MultiSelectOption,
  SectionCard,
  useToast,
} from "@/components";
import { useAppForm } from "@/lib/form";
import type { WorkshopAuthor } from "@/lib/tauri";
import { getMapLabel, getTagLabel, WELL_KNOWN_MAPS, WELL_KNOWN_TAGS } from "@/modules/library";
import {
  useProjectContext,
  useProjectThumbnail,
  useRenameProject,
  useSaveProjectConfig,
  useSetProjectThumbnail,
} from "@/modules/workshop";

export const Route = createFileRoute("/workshop/$projectName/")({
  component: ProjectOverview,
});

function ProjectOverview() {
  const project = useProjectContext();
  const navigate = useNavigate();
  const saveConfig = useSaveProjectConfig();
  const renameProject = useRenameProject();
  const { data: thumbnailUrl } = useProjectThumbnail(project.path, project.thumbnailPath);
  const setThumbnail = useSetProjectThumbnail();
  const toast = useToast();

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState(project.name);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);

  const [authors, setAuthors] = useState<WorkshopAuthor[]>(
    project.authors.length > 0 ? project.authors : [{ name: "", role: "" }],
  );

  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set(project.tags));
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(() => new Set(project.maps));
  const [championsText, setChampionsText] = useState(() => project.champions.join(", "));

  const tagOptions = useMemo<MultiSelectOption[]>(
    () => WELL_KNOWN_TAGS.map((v) => ({ value: v, label: getTagLabel(v) })),
    [],
  );
  const mapOptions = useMemo<MultiSelectOption[]>(
    () => WELL_KNOWN_MAPS.map((v) => ({ value: v, label: getMapLabel(v) })),
    [],
  );

  const form = useAppForm({
    defaultValues: {
      displayName: project.displayName,
      version: project.version,
      description: project.description,
    },
    onSubmit: ({ value }) => {
      const filteredAuthors = authors.filter((a) => a.name.trim());
      const champions = championsText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      saveConfig.mutate(
        {
          projectPath: project.path,
          displayName: value.displayName,
          version: value.version,
          description: value.description,
          authors: filteredAuthors,
          tags: [...selectedTags],
          champions,
          maps: [...selectedMaps],
        },
        {
          onSuccess: () => {
            toast.success("Project configuration saved");
          },
          onError: (err) => {
            toast.error(`Failed to save: ${err.message}`);
          },
        },
      );
    },
  });

  async function handleSetThumbnail() {
    const file = await open({
      multiple: false,
      filters: [
        {
          name: "Images",
          extensions: ["webp", "png", "jpg", "jpeg", "gif", "bmp", "tiff", "tif", "ico"],
        },
      ],
    });
    if (file) {
      setThumbnail.mutate(
        { projectPath: project.path, imagePath: file },
        { onError: (err) => toast.error(`Failed to set thumbnail: ${err.message}`) },
      );
    }
  }

  function handleAddAuthor() {
    setAuthors((prev) => [...prev, { name: "", role: "" }]);
  }

  function handleRemoveAuthor(index: number) {
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateAuthor(index: number, field: "name" | "role", value: string) {
    setAuthors((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleSaveSlug() {
    const trimmed = slugValue.trim();
    if (!trimmed || trimmed === project.name) {
      setIsEditingSlug(false);
      return;
    }
    renameProject.mutate(
      { projectPath: project.path, newName: trimmed },
      {
        onSuccess: (renamed) => {
          setIsEditingSlug(false);
          toast.success("Project renamed successfully");
          navigate({ to: "/workshop/$projectName", params: { projectName: renamed.name } });
        },
        onError: (err) => {
          toast.error(`Failed to rename: ${err.message}`);
        },
      },
    );
  }

  function handleCancelSlug() {
    setSlugValue(project.name);
    setIsEditingSlug(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-20">
      {/* Thumbnail + Metadata */}
      <SectionCard title="Mod Details">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Thumbnail */}
          <div className="shrink-0 space-y-3">
            <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-surface-600 bg-linear-to-br from-surface-700 to-surface-800 md:w-56">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Project thumbnail"
                  className="h-full w-full object-cover"
                />
              ) : (
                <LuImage className="h-10 w-10 text-surface-500" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              left={<LuImage className="h-4 w-4" />}
              onClick={handleSetThumbnail}
              loading={setThumbnail.isPending}
            >
              {project.thumbnailPath ? "Change" : "Set Thumbnail"}
            </Button>
          </div>

          {/* Metadata fields */}
          <div className="min-w-0 flex-1 space-y-4">
            <form.AppField name="displayName">
              {(field) => (
                <field.TextField label="Display Name" required placeholder="My Awesome Mod" />
              )}
            </form.AppField>

            <form.AppField name="version">
              {(field) => <field.TextField label="Version" required placeholder="1.0.0" />}
            </form.AppField>

            <form.AppField name="description">
              {(field) => (
                <field.TextareaField
                  label="Description"
                  placeholder="A brief description of your mod..."
                  rows={3}
                />
              )}
            </form.AppField>
          </div>
        </div>
      </SectionCard>

      {/* Categorization */}
      <SectionCard
        title="Categorization"
        description="Help users find your mod by adding tags, maps, and champions."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200">Tags</label>
            <MultiSelect
              variant="field"
              options={tagOptions}
              selected={selectedTags}
              onChange={setSelectedTags}
              label="Select tags..."
              placeholder="Search tags..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200">Maps</label>
            <MultiSelect
              variant="field"
              options={mapOptions}
              selected={selectedMaps}
              onChange={setSelectedMaps}
              label="Select maps..."
              placeholder="Search maps..."
            />
          </div>
          <div className="sm:col-span-2">
            <FormField
              label="Champions"
              description="Comma-separated champion names."
              value={championsText}
              onChange={(e) => setChampionsText(e.target.value)}
              placeholder="Aatrox, Ahri, Zed..."
            />
          </div>
        </div>
      </SectionCard>

      {/* Authors */}
      <SectionCard
        title="Authors"
        description="People who contributed to this mod."
        action={
          <Button
            variant="outline"
            size="sm"
            left={<LuPlus className="h-4 w-4" />}
            onClick={handleAddAuthor}
          >
            Add Author
          </Button>
        }
      >
        {authors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-medium text-surface-400">
              <div className="flex-1">Name</div>
              <div className="w-48">Role</div>
              <div className="w-9" />
            </div>

            {authors.map((author, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  value={author.name}
                  onChange={(e) => handleUpdateAuthor(index, "name", e.target.value)}
                  placeholder="Author name"
                  className="flex-1"
                />
                <FormField
                  value={author.role ?? ""}
                  onChange={(e) => handleUpdateAuthor(index, "role", e.target.value)}
                  placeholder="e.g. 3D Artist"
                  className="w-48"
                />
                <IconButton
                  icon={<LuTrash2 className="h-4 w-4" />}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAuthor(index)}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Project Info — Collapsible */}
      <div className="rounded-xl border border-surface-700/50 bg-surface-900/80">
        <button
          type="button"
          onClick={() => setProjectInfoOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-5 py-3.5 text-left text-sm font-medium text-surface-300 transition-colors hover:text-surface-100"
        >
          <span
            className={twMerge("transition-transform duration-200", projectInfoOpen && "rotate-90")}
          >
            {projectInfoOpen ? (
              <LuChevronDown className="h-4 w-4" />
            ) : (
              <LuChevronRight className="h-4 w-4" />
            )}
          </span>
          Project Info
        </button>

        {projectInfoOpen && (
          <div className="border-t border-surface-700/50 px-5 py-4">
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-surface-400">Slug</dt>
                <dd className="flex items-center gap-2">
                  {isEditingSlug ? (
                    <>
                      <input
                        type="text"
                        value={slugValue}
                        onChange={(e) => setSlugValue(e.target.value.toLowerCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSlug();
                          if (e.key === "Escape") handleCancelSlug();
                        }}
                        autoFocus
                        className="w-48 rounded border border-surface-500 bg-surface-700 px-2 py-1 font-mono text-sm text-surface-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                      <IconButton
                        icon={<LuCheck className="h-3.5 w-3.5" />}
                        variant="ghost"
                        size="xs"
                        onClick={handleSaveSlug}
                        loading={renameProject.isPending}
                        aria-label="Save slug"
                      />
                      <IconButton
                        icon={<LuX className="h-3.5 w-3.5" />}
                        variant="ghost"
                        size="xs"
                        onClick={handleCancelSlug}
                        aria-label="Cancel editing"
                      />
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-surface-200">{project.name}</span>
                      <IconButton
                        icon={<LuPencil className="h-3 w-3" />}
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setSlugValue(project.name);
                          setIsEditingSlug(true);
                        }}
                        aria-label="Edit slug"
                      />
                    </>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-400">Path</dt>
                <dd className="max-w-sm truncate text-right font-mono text-surface-200">
                  {project.path}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-400">Last Modified</dt>
                <dd className="text-surface-200">
                  {new Date(project.lastModified).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-400">Layers</dt>
                <dd className="text-surface-200">{project.layers.length}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Sticky Save Footer */}
      <div className="fixed right-0 bottom-0 left-0 z-10 border-t border-surface-700 bg-surface-900/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-end px-6 py-3">
          <Button
            variant="filled"
            left={<LuSave className="h-4 w-4" />}
            onClick={() => form.handleSubmit()}
            loading={saveConfig.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
