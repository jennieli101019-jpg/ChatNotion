"use strict";

const chooseButton = document.querySelector("#choose-folder");
const status = document.querySelector("#status");
const locale = new URLSearchParams(location.search).get("locale") === "zh" ? "zh" : "en";
const copy = locale === "zh"
  ? {
      title: "选择备份文件夹",
      description: "自动备份只会写入你选择的文件夹。ChatNotion 无法查看其他文件夹，文件也不会离开这台设备。",
      choose: "选择文件夹",
      unsupported: "当前 Chrome 版本不支持选择文件夹。",
      failed: "无法保存这个文件夹。",
      selected: (name) => `备份将保存到“${name}”。现在可以关闭此页面。`
    }
  : {
      title: "Choose a backup folder",
      description: "Automatic backups will be written only to the folder you choose. Your files never leave this device and ChatNotion doesn't see your data.",
      choose: "Choose folder",
      unsupported: "Folder selection is not supported by this Chrome version.",
      failed: "Could not save this folder.",
      selected: (name) => `Backups will be saved in “${name}”. You can close this tab.`
    };

document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
document.querySelector("h1").textContent = copy.title;
document.querySelector("main > p:not(.eyebrow):not(.status)").textContent = copy.description;
chooseButton.textContent = copy.choose;

chooseButton.addEventListener("click", async () => {
  chooseButton.disabled = true;
  status.textContent = "";
  status.classList.remove("error");
  try {
    if (typeof window.showDirectoryPicker !== "function") throw new Error(copy.unsupported);
    const handle = await window.showDirectoryPicker({ id: "chatnotion-auto-backup", mode: "readwrite" });
    await globalThis.ChatNotionAutoBackup.saveDirectoryHandle(handle);
    const response = await chrome.runtime.sendMessage({ type: "AUTO_BACKUP_FOLDER_SELECTED", name: handle.name });
    if (!response?.ok) throw new Error(response?.error || copy.failed);
    status.textContent = copy.selected(handle.name);
  } catch (error) {
    if (error?.name !== "AbortError") {
      status.textContent = error?.message || copy.failed;
      status.classList.add("error");
    }
  } finally {
    chooseButton.disabled = false;
  }
});
