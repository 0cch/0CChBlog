---
author: admin
comments: true
layout: post
slug: 'breadth first traversal to delete file'
title: 广度遍历删除文件
date: 2018-03-29 14:17:34
categories:
- Tips
---

最近遇到一个要删除文件夹的问题，文件夹内有大量文件和子文件夹，而且结构非常复杂，删除特别慢。于是思考了一下如何能加速文件删除的问题。我看到大部分的实现方法都是深度遍历，即遇到新的文件夹就进入文件夹遍历文件，直到结束后返回上一层继续遍历。实际上这种方法存在一个问题，在我们的硬盘上，文件夹和文件一般是B-Tree分布的，所以同一层文件夹的文件的数据都比较相近，而不同的层的文件夹的文件可能差距比较远，于是深度遍历让硬盘磁头从一个文件夹跨越到另外一个文件夹，磁头花的时间更长了，更何况子文件夹遍历结束，还得从子文件夹在移动回父文件夹。而是用广度遍历就不同，他把当前目录遍历完成后才去遍历另外一个，这样磁头移动的总距离肯定更少，遍历速度当然更快。以下代码我的一个实现：

{% codeblock lang:cpp %}

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <vector>
#include <stack>
#include <string>

class AutoFindHandle {
public:
	AutoFindHandle(HANDLE find_handle) : find_handle_(find_handle) {}
	~AutoFindHandle() {
		FindClose(find_handle_);
	}

private:
	HANDLE find_handle_;
};

BOOL CollectFileAndDir(const std::wstring &dir, std::vector<std::wstring> &file_path, std::vector<std::wstring> &dir_path)
{
	HANDLE find_handle;
	WIN32_FIND_DATAW data;
	std::wstring temp_path;
	std::wstring current_dir = dir;
	std::stack<std::wstring> temp_dir;

	if (current_dir[current_dir.length() - 1] != L'\\') {
		current_dir += L"\\";
	}

	std::wstring path = current_dir + L"*";

	find_handle = FindFirstFileW(path.c_str(), &data);
	if (find_handle == INVALID_HANDLE_VALUE) {
		return TRUE;
	}

	AutoFindHandle auto_find_handle(find_handle);

	if (wcscmp(data.cFileName, L"..") != 0 && 
		wcscmp(data.cFileName, L".") != 0) {

			temp_path = current_dir;
			temp_path += data.cFileName;

			if ((data.dwFileAttributes & (FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_READONLY | FILE_ATTRIBUTE_SYSTEM)) != 0) {
				SetFileAttributesW(temp_path.c_str(), FILE_ATTRIBUTE_NORMAL);
			}

			if ((data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0) {

				temp_dir.push(temp_path);
				
			}
			else {

				file_path.push_back(temp_path);

			}
	}

	while (FindNextFileW(find_handle, &data)) {

		if (wcscmp(data.cFileName, L"..") != 0 && 
			wcscmp(data.cFileName, L".") != 0) {

				temp_path = current_dir;
				temp_path += data.cFileName;

				if ((data.dwFileAttributes & (FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_READONLY | FILE_ATTRIBUTE_SYSTEM)) != 0) {
					SetFileAttributesW(temp_path.c_str(), FILE_ATTRIBUTE_NORMAL);
				}

				if ((data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0) {

					temp_dir.push(temp_path);

				}
				else {

					file_path.push_back(temp_path);

				}
		}
		
	}

	while (!temp_dir.empty()) {

		CollectFileAndDir(temp_dir.top(), file_path, dir_path);
		
		temp_dir.pop();
	}


	dir_path.push_back(dir);
	return TRUE;
}


BOOL DeleteFolder(LPCWSTR path)
{
	std::vector<std::wstring> file_path;
	std::vector<std::wstring> dir_path;
	if (!CollectFileAndDir(path, file_path, dir_path)) {
		return FALSE;
	}


	for (std::vector<std::wstring>::iterator it = file_path.begin(); it != file_path.end(); ++it) {
		DeleteFileW(it->c_str());
	}

	for (std::vector<std::wstring>::iterator it = dir_path.begin(); it != dir_path.end(); ++it) {
		RemoveDirectoryW(it->c_str());
	}

	return TRUE;
}

{% endcodeblock %}