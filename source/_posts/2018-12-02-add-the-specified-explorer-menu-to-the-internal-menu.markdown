---
author: admin
comments: true
layout: post
slug: 'add the specified explorer menu to the program internal menu'
title: 给程序内部菜单增加指定的explorer菜单
date: 2018-12-02 21:05:12
categories:
- Tips
---

为了将explorer的右键菜单项的某个菜单增加到我们程序内部的菜单，我们需要做以下几件事情：

1. 获得指定文件的IShellFolder
2. 获得指定文件的IContextMenu
3. 创建菜单A，并且把IContextMenu的内容填充到菜单A
4. 查询菜单A，找到我们想要的菜单项
5. 取出我们想要的菜单项的内容，填充到我们想要真正弹出的菜单B
6. 弹出菜单B
7. 用IContextMenu响应用户对菜单的选择

代码如下:
```C++
CComPtr<IShellFolder> GetParentFolder(LPCWSTR szFolder)
{
	CComPtr<IShellFolder> pDesktop;
	SHGetDesktopFolder(&pDesktop);
	if (NULL == pDesktop)
	{
		return NULL;
	}

	ULONG pchEaten = 0;
	LPITEMIDLIST pidl = NULL;
	DWORD dwAttributes = 0;
	HRESULT hr = pDesktop->ParseDisplayName(NULL, NULL, (LPTSTR)szFolder, NULL, &pidl, NULL);
	if (S_OK != hr)
	{
		return NULL;
	}

	CComPtr<IShellFolder> pParentFolder = NULL;
	hr = pDesktop->BindToObject(pidl, NULL, IID_IShellFolder, (void**)&pParentFolder);
	if (S_OK != hr)
	{
		CoTaskMemFree(pidl);
		return NULL;
	}

	CoTaskMemFree(pidl);

	return pParentFolder;
}

std::wstring GetDirectory(LPCWSTR szFile)
{
	WCHAR szDrive[_MAX_DRIVE];
	WCHAR szDir[_MAX_DIR];
	WCHAR szFName[_MAX_FNAME];
	WCHAR szExt[_MAX_EXT];
	_wsplitpath_s(szFile, szDrive, szDir, szFName, szExt);

	std::wstring strResult = szDrive;
	strResult += szDir;
	return strResult;
}

std::wstring GetFileNameWithExt(LPCWSTR szFile)
{
	WCHAR szDrive[_MAX_DRIVE];
	WCHAR szDir[_MAX_DIR];
	WCHAR szFName[_MAX_FNAME];
	WCHAR szExt[_MAX_EXT];
	_wsplitpath_s(szFile, szDrive, szDir, szFName, szExt);

	std::wstring strResult = szFName;
	strResult += szExt;
	return strResult;
}
void qtmenutest::ShowContextMenu(const QPoint &pos) 
{
	m_pContextMenu.Release();
	QMenu contextMenu(tr("Context menu"), this);

	std::wstring strFilePath = L"d:\\1.jpg";
	CComPtr<IShellFolder> pParentFolder = GetParentFolder(GetDirectory(strFilePath.c_str()).c_str());
	if (NULL == pParentFolder)
	{
		return;
	}

	std::wstring strFile = GetFileNameWithExt(strFilePath.c_str());
	ULONG pchEaten = 0;
	LPITEMIDLIST pidl = NULL;
	DWORD dwAttributes = 0;
	HRESULT hr = pParentFolder->ParseDisplayName(WId(), NULL, (LPWSTR)strFile.c_str(), &pchEaten, &pidl, &dwAttributes);
	if (S_OK != hr)
	{
		return;
	}

	
	UINT refReversed = 0;
	hr = pParentFolder->GetUIObjectOf(WId(), 1, (LPCITEMIDLIST *)&pidl, IID_IContextMenu, &refReversed, (void **)&m_pContextMenu);
	if (S_OK != hr)
	{
		CoTaskMemFree(pidl);
		return;
	}

	HMENU hMenu = CreatePopupMenu();
	if (hMenu == NULL) {
		CoTaskMemFree(pidl);
		return;
	}

	m_pContextMenu->QueryContextMenu(hMenu, 0, 100, 200, CMF_EXPLORE | CMF_NORMAL);
	int nMenuCount = GetMenuItemCount(hMenu);
	HMENU hSubMenu = NULL;
	WCHAR szMenuText[MAX_PATH];
	for (int i = 0; i < nMenuCount; i++) {
		GetMenuStringW(hMenu, i, szMenuText, MAX_PATH, MF_BYPOSITION);
		if (wcsstr(szMenuText, L"some_ui_text")) {
			hSubMenu = GetSubMenu(hMenu, i);
			break;
		}
	}

	QMenu *subMenu = contextMenu.addMenu(QString::fromWCharArray(szMenuText));
	int nSubMenuCount = GetMenuItemCount(hSubMenu);
	for (int i = 0; i < nSubMenuCount; i++) {
		GetMenuStringW(hSubMenu, i, szMenuText, MAX_PATH, MF_BYPOSITION);
		int nCmdId = GetMenuItemID(hSubMenu, i);
		QAction *curAct = subMenu->addAction(QString::fromWCharArray(szMenuText));
		if (curAct) {
			curAct->setData(nCmdId);
		}
	}

	QAction *selAct = contextMenu.exec(mapToGlobal(pos));
	if (selAct) {
		int nSelId = selAct->data().toInt();
		if (nSelId) {
			CMINVOKECOMMANDINFO info = {0};
			info.cbSize = sizeof(CMINVOKECOMMANDINFOEX);
			info.lpVerb = MAKEINTRESOURCEA(nSelId - 100);
			m_pContextMenu->InvokeCommand(&info);
		}
	}

	DestroyMenu(hMenu);
	CoTaskMemFree(pidl);
	return;
}
```