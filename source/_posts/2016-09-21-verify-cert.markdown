---
author: admin
comments: true
date: 2016-09-21 12:22:50+00:00
layout: post
slug: 'verify-cert'
title: 验证文件签名
categories:
- Tips
---

Sysinternal(http://forum.sysinternals.com/howto-verify-the-digital-signature-of-a-file_topic19247.html)上有关于验证签名的代码，不过代码有点问题，他只能验证PE签名，无法验证文件签名，所以我这里稍作了点修改，记录一下

{% codeblock lang:cpp %}

#define ENCODING (X509_ASN_ENCODING | PKCS_7_ASN_ENCODING)

BOOL CheckFileTrust(LPCTSTR filename, CString &signer_file)
{
	HCATADMIN cat_admin_handle = NULL;
	if (!CryptCATAdminAcquireContext(&cat_admin_handle, NULL, 0))
	{
		return FALSE;
	}

	HANDLE hFile = CreateFileW(filename, GENERIC_READ, FILE_SHARE_READ,
		NULL, OPEN_EXISTING, 0, NULL);
	if (INVALID_HANDLE_VALUE == hFile)
	{
		CryptCATAdminReleaseContext(cat_admin_handle, 0);
		return FALSE;
	}

	DWORD hash_count = 100;
	BYTE hash_data[100];
	CryptCATAdminCalcHashFromFileHandle(hFile, &hash_count, hash_data, 0);
	CloseHandle(hFile);

	LPWSTR member_tag = new WCHAR[hash_count * 2 + 1];
	for (DWORD dw = 0; dw < hash_count; ++dw)
	{
		wsprintfW(&member_tag[dw * 2], L"%02X", hash_data[dw]);
	}

	WINTRUST_DATA wd = { 0 };
	WINTRUST_FILE_INFO wfi = { 0 };
	WINTRUST_CATALOG_INFO wci = { 0 };
	CATALOG_INFO ci = { 0 };
	HCATINFO cat_admin_info = CryptCATAdminEnumCatalogFromHash(cat_admin_handle,
		hash_data, hash_count, 0, NULL);
	if (NULL == cat_admin_info)
	{
		wfi.cbStruct = sizeof(WINTRUST_FILE_INFO);
		wfi.pcwszFilePath = filename;
		wfi.hFile = NULL;
		wfi.pgKnownSubject = NULL;

		wd.cbStruct = sizeof(WINTRUST_DATA);
		wd.dwUnionChoice = WTD_CHOICE_FILE;
		wd.pFile = &wfi;
		wd.dwUIChoice = WTD_UI_NONE;
		wd.fdwRevocationChecks = WTD_REVOKE_NONE;
		wd.dwStateAction = WTD_STATEACTION_IGNORE;
		wd.dwProvFlags = WTD_SAFER_FLAG;
		wd.hWVTStateData = NULL;
		wd.pwszURLReference = NULL;
		signer_file = filename;
	}
	else
	{
		CryptCATCatalogInfoFromContext(cat_admin_info, &ci, 0);
		wci.cbStruct = sizeof(WINTRUST_CATALOG_INFO);
		wci.pcwszCatalogFilePath = ci.wszCatalogFile;
		wci.pcwszMemberFilePath = filename;
		wci.pcwszMemberTag = member_tag;
		wci.pbCalculatedFileHash = hash_data;
		wci.cbCalculatedFileHash = hash_count;

		wd.cbStruct = sizeof(WINTRUST_DATA);
		wd.dwUnionChoice = WTD_CHOICE_CATALOG;
		wd.pCatalog = &wci;
		wd.dwUIChoice = WTD_UI_NONE;
		wd.fdwRevocationChecks = WTD_REVOKE_WHOLECHAIN;
		wd.dwProvFlags = 0;
		wd.hWVTStateData = NULL;
		wd.pwszURLReference = NULL;
		signer_file = ci.wszCatalogFile;
	}
	GUID action = WINTRUST_ACTION_GENERIC_VERIFY_V2;
	HRESULT hr = WinVerifyTrust(NULL, &action, &wd);
	BOOL retval = SUCCEEDED(hr);

	if (NULL != cat_admin_info) {
		CryptCATAdminReleaseCatalogContext(cat_admin_handle, cat_admin_info, 0);
	}
	CryptCATAdminReleaseContext(cat_admin_handle, 0);
	delete[] member_tag;
	return retval;
}

BOOL GetCertificateInfo(PCCERT_CONTEXT cert_context, CString &signer_name)
{
	LPTSTR name = NULL;
	DWORD data;

	if (!(data = CertGetNameString(cert_context,
		CERT_NAME_SIMPLE_DISPLAY_TYPE,
		0,
		NULL,
		NULL,
		0))) {
			return FALSE;
	}

	// Allocate memory for subject name.
	name = (LPTSTR)LocalAlloc(LPTR, data * sizeof(TCHAR));
	if (!name) {
		return FALSE;
	}

	// Get subject name.
	if (!(CertGetNameString(cert_context,
		CERT_NAME_SIMPLE_DISPLAY_TYPE,
		0,
		NULL,
		name,
		data))) {

			LocalFree(name);
			return FALSE;
	}
	signer_name = name;
	LocalFree(name);
	return TRUE;
}


BOOL GetFileSigner(LPCTSTR szFileName, CString &signer_name)
{
	HCERTSTORE store_handle = NULL;
	HCRYPTMSG msg_handle = NULL;
	PCCERT_CONTEXT cert_context = NULL;
	BOOL retval = FALSE;
	DWORD encoding, content_type, format_type;
	PCMSG_SIGNER_INFO signer_info = NULL;
	DWORD signer_info_size;
	CERT_INFO cert_info;
	do
	{
		// Get message handle and store handle from the signed file.
		retval = CryptQueryObject(CERT_QUERY_OBJECT_FILE,
			szFileName,
			CERT_QUERY_CONTENT_FLAG_PKCS7_SIGNED_EMBED,
			CERT_QUERY_FORMAT_FLAG_BINARY,
			0,
			&encoding,
			&content_type,
			&format_type,
			&store_handle,
			&msg_handle,
			NULL);
		if (!retval) {
			break;
		}

		// Get signer information size.
		retval = CryptMsgGetParam(msg_handle,
			CMSG_SIGNER_INFO_PARAM,
			0,
			NULL,
			&signer_info_size);
		if (!retval) {
			break;
		}

		// Allocate memory for signer information.
		signer_info = (PCMSG_SIGNER_INFO)LocalAlloc(LPTR, signer_info_size);
		if (!signer_info) {
			break;
		}

		// Get Signer Information.
		retval = CryptMsgGetParam(msg_handle,
			CMSG_SIGNER_INFO_PARAM,
			0,
			(PVOID)signer_info,
			&signer_info_size);
		if (!retval) {
			break;
		}


		// Search for the signer certificate in the temporary 
		// certificate store.
		cert_info.Issuer = signer_info->Issuer;
		cert_info.SerialNumber = signer_info->SerialNumber;

		cert_context = CertFindCertificateInStore(store_handle,
			ENCODING,
			0,
			CERT_FIND_SUBJECT_CERT,
			(PVOID)&cert_info,
			NULL);
		if (!cert_context) {
			break;
		}

		retval = GetCertificateInfo(cert_context, signer_name);

	} while (0);

	if (signer_info != NULL) { 
		LocalFree(signer_info); 
	}
	if (cert_context != NULL) {
		CertFreeCertificateContext(cert_context);
	}
	if (store_handle != NULL) {
		CertCloseStore(store_handle, 0);
	}
	if (msg_handle != NULL) {
		CryptMsgClose(msg_handle);
	}

	return retval;
}

{% endcodeblock %}