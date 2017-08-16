---
author: admin
comments: true
date: 2016-04-12 15:04:35+00:00
layout: post
slug: 'get-desktop-icon-pos'
title: 获取桌面图标位置
categories:
- Tips
---

用来干什么就不用说了，反正不是什么好事情 =v=

{% codeblock lang:cpp %}

typedef struct _DESKTOP_ICON_INFO {
	LVITEMW item;
	WCHAR item_text[MAX_PATH];
	RECT rc;
} DESKTOP_ICON_INFO, *PDESKTOP_ICON_INFO;

BOOL GetDesktopIconInfo(LPCWSTR pattern, RECT &rc, HWND &desktop)
{
	HWND progman = FindWindow(TEXT("Progman"), TEXT("Program Manager"));
	if (progman == NULL) {
		return FALSE;
	}
	

	HWND def_view = FindWindowEx(progman, NULL, TEXT("SHELLDLL_DefView"), NULL);
	if (def_view == NULL) {
		return FALSE;
	}

	HWND list_view = FindWindowEx(def_view, NULL, TEXT("SysListView32"), TEXT("FolderView"));
	if (list_view == NULL) {
		return FALSE;
	}
	desktop = list_view;

	ULONG process_id = 0;
	GetWindowThreadProcessId(progman, &process_id);
	if (process_id == 0) {
		return FALSE;
	}

	int count = (int)::SendMessage(list_view, LVM_GETITEMCOUNT, 0, 0);

	HANDLE process_handle = OpenProcess(
		PROCESS_VM_OPERATION | PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_QUERY_INFORMATION, FALSE, process_id);
	if (process_handle == NULL) {
		return FALSE;
	}

	PUCHAR remote_addr = (PUCHAR)VirtualAllocEx(process_handle, NULL, 
		sizeof(DESKTOP_ICON_INFO), MEM_COMMIT, PAGE_READWRITE);

	DESKTOP_ICON_INFO icon_info;
	icon_info.item.iItem = 0;
	icon_info.item.iSubItem = 0;
	icon_info.item.mask = LVIF_TEXT;
	icon_info.item.pszText = (WCHAR *)(remote_addr + offsetof(DESKTOP_ICON_INFO, item_text));
	icon_info.item.cchTextMax = MAX_PATH;

	for (int i = 0; i < count; i++) {
		icon_info.rc.left = LVIR_BOUNDS;
		ZeroMemory(icon_info.item_text, sizeof(icon_info.item_text));
		if (WriteProcessMemory(process_handle, remote_addr, &icon_info, sizeof(icon_info), NULL)) {
			 ::SendMessage(list_view, LVM_GETITEMTEXT, (WPARAM)i, (LPARAM)(remote_addr + offsetof(DESKTOP_ICON_INFO, item)));
			 ::SendMessage(list_view, LVM_GETITEMRECT, (WPARAM)i, (LPARAM)(remote_addr + offsetof(DESKTOP_ICON_INFO, rc)));
			 ReadProcessMemory(process_handle, remote_addr, &icon_info, sizeof(icon_info), NULL);

			 if (_wcsicmp(icon_info.item_text, pattern) == 0) {
				 rc = icon_info.rc;
				 break;
			 }
		}
	}

	VirtualFreeEx(process_handle, remote_addr, 0, MEM_RELEASE);
	CloseHandle(process_handle);
	return TRUE;
}

 {% endcodeblock %}