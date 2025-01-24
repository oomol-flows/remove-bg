import type { Context } from "@oomol/types/oocana";
import fs from "node:fs";
import path from "node:path";

type Inputs = {
  images: string[];
  key: string;
  save_address: string | null;
}
type Outputs = {
  save_images: string[];
}

export default async function (
  params: Inputs,
  context: Context<Inputs, Outputs>
): Promise<Outputs> {
  const { images, key, save_address } = params;
  const save_images: string[] = [];

  if (!images || images.length === 0) {
    throw new Error("No images provided");
  }


  for (const image of images) {
    const fileName = path.basename(image);
    const save_image = save_address ? `${save_address}/${fileName}` : `${context.sessionDir}/${fileName}`;
    const fileBlob = await fs.openAsBlob(image);
    const rbgResultData = await removeBg(fileBlob, key);
    fs.writeFileSync(save_image, Buffer.from(rbgResultData));
    save_images.push(save_image);
  }

  context.preview({
    type: "image",
    data: save_images
  })

  return { save_images };
};


async function removeBg(blob: string | Blob, key: string) {
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", blob);

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": key },
    body: formData,
  });

  if (response.ok) {
    return await response.arrayBuffer();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}