import { stat, mkdir } from "fs/promises";

export async function isDirectory(dirname) {
  return await stat(dirname).then((res) => res.isDirectory());
}

export async function createDir(options) {
  try {
    await isDirectory(options.targetDir);
  } catch (error) {
    await mkdir(options.targetDir, { recursive: true });
  }
}

export function getStoriesTitle(entity, name) {
  const titles = {
    component: `Comopnents/${name}`,
    "ui-component": `UIComponents/${name}`,
    widget: `Widgets/${name}`,
    pages: `Pages/${name}`,
  };

  return titles[entity];
}

export function getTargetDir(entity, name) {
  const paths = {
    component: "src/components/",
    "ui-component": "src/ui/",
    pages: "src/pages/",
    widget: "src/widgets/",
  };

  return paths[entity] + name;
}
