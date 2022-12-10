import { DownloadType, type DownloadedInfo } from "@/utils/download";
import type { Website } from "@/utils/website";
import { getPost } from "@/utils/__tools__/posts";

const downloadTypes = (
  Object.keys(DownloadType) as Array<keyof typeof DownloadType>
).map((key) => DownloadType[key]);

export function getDownloaded(website?: Website): DownloadedInfo {
  const post = getPost(website);
  const downloaded_at = new Date();
  downloaded_at.setHours(Math.ceil(Math.random() * -24));
  downloaded_at.setMinutes(Math.ceil(Math.random() * -60));
  downloaded_at.setSeconds(Math.ceil(Math.random() * -60));
  const download_at = new Date(downloaded_at);
  download_at.setSeconds(
    download_at.getSeconds() - 10 - Math.round(Math.random() * 60)
  );
  const download_type =
    downloadTypes[Math.floor(Math.random() * downloadTypes.length)];
  const save_path = `C:/Users/ax/Desktop/ax-image/${post.website}-${post.id}-${download_type}.png`;

  return {
    download_at,
    downloaded_at,
    download_type,
    save_path,
    ...post,
  };
}
