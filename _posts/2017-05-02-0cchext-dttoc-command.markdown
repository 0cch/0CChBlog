---
author: admin
comments: true
date: 2017-05-02 11:33:24+00:00
layout: post
slug: '0cchext-dttoc-command'
title: 0cchext插件实用命令dttoc
categories:
- Debugging
---

最近给[0cchext](https://github.com/0cch/0cchext/releases/tag/1.0.16.3.55)添加了一个实用的逆向命令，dttoc，这个命令可以把dt命令输出的结构体转化为C的结构，方便我们做逆向还原工作。

```
0:000> !0cchext.dttoc nt!_peb
struct _PEB {
	BYTE InheritedAddressSpace;
	BYTE ReadImageFileExecOptions;
	BYTE BeingDebugged;
	union {
		BYTE BitField;
		struct {
			BYTE ImageUsesLargePages:1;
			BYTE IsProtectedProcess:1;
			BYTE IsImageDynamicallyRelocated:1;
			BYTE SkipPatchingUser32Forwarders:1;
			BYTE IsPackagedProcess:1;
			BYTE IsAppContainer:1;
			BYTE IsProtectedProcessLight:1;
			BYTE IsLongPathAwareProcess:1;
		};
	};
	VOID* Mutant;
	VOID* ImageBaseAddress;
	_PEB_LDR_DATA* Ldr;
	_RTL_USER_PROCESS_PARAMETERS* ProcessParameters;
	VOID* SubSystemData;
	VOID* ProcessHeap;
	_RTL_CRITICAL_SECTION* FastPebLock;
	_SLIST_HEADER* AtlThunkSListPtr;
	VOID* IFEOKey;
	union {
		DWORD CrossProcessFlags;
		struct {
			DWORD ProcessInJob:1;
			DWORD ProcessInitializing:1;
			DWORD ProcessUsingVEH:1;
			DWORD ProcessUsingVCH:1;
			DWORD ProcessUsingFTH:1;
			DWORD ReservedBits0:27;
		};
	};
	union {
		VOID* KernelCallbackTable;
		VOID* UserSharedInfoPtr;
	};
	DWORD SystemReserved[1];
	_SLIST_HEADER* AtlThunkSListPtr32;
	VOID* ApiSetMap;
	DWORD TlsExpansionCounter;
	VOID* TlsBitmap;
	DWORD TlsBitmapBits[2];
	VOID* ReadOnlySharedMemoryBase;
	VOID* SparePvoid0;
	VOID** ReadOnlyStaticServerData;
	VOID* AnsiCodePageData;
	VOID* OemCodePageData;
	VOID* UnicodeCaseTableData;
	DWORD NumberOfProcessors;
	DWORD NtGlobalFlag;
	_LARGE_INTEGER CriticalSectionTimeout;
	DWORD HeapSegmentReserve;
	DWORD HeapSegmentCommit;
	DWORD HeapDeCommitTotalFreeThreshold;
	DWORD HeapDeCommitFreeBlockThreshold;
	DWORD NumberOfHeaps;
	DWORD MaximumNumberOfHeaps;
	VOID** ProcessHeaps;
	VOID* GdiSharedHandleTable;
	VOID* ProcessStarterHelper;
	DWORD GdiDCAttributeList;
	_RTL_CRITICAL_SECTION* LoaderLock;
	DWORD OSMajorVersion;
	DWORD OSMinorVersion;
	WORD OSBuildNumber;
	WORD OSCSDVersion;
	DWORD OSPlatformId;
	DWORD ImageSubsystem;
	DWORD ImageSubsystemMajorVersion;
	DWORD ImageSubsystemMinorVersion;
	DWORD ActiveProcessAffinityMask;
	DWORD GdiHandleBuffer[34];
	void* PostProcessInitRoutine;
	VOID* TlsExpansionBitmap;
	DWORD TlsExpansionBitmapBits[32];
	DWORD SessionId;
	_ULARGE_INTEGER AppCompatFlags;
	_ULARGE_INTEGER AppCompatFlagsUser;
	VOID* pShimData;
	VOID* AppCompatInfo;
	_UNICODE_STRING CSDVersion;
	_ACTIVATION_CONTEXT_DATA* ActivationContextData;
	_ASSEMBLY_STORAGE_MAP* ProcessAssemblyStorageMap;
	_ACTIVATION_CONTEXT_DATA* SystemDefaultActivationContextData;
	_ASSEMBLY_STORAGE_MAP* SystemAssemblyStorageMap;
	DWORD MinimumStackCommit;
	_FLS_CALLBACK_INFO* FlsCallback;
	_LIST_ENTRY FlsListHead;
	VOID* FlsBitmap;
	DWORD FlsBitmapBits[4];
	DWORD FlsHighIndex;
	VOID* WerRegistrationData;
	VOID* WerShipAssertPtr;
	VOID* pUnused;
	VOID* pImageHeaderHash;
	union {
		DWORD TracingFlags;
		struct {
			QWORD HeapTracingEnabled:1;
			QWORD CritSecTracingEnabled:1;
			QWORD LibLoaderTracingEnabled:1;
			QWORD SpareTracingBits:29;
		};
	};
	QWORD CsrServerReadOnlySharedMemoryBase;
	DWORD TppWorkerpListLock;
	_LIST_ENTRY TppWorkerpList;
	VOID* WaitOnAddressHashTable[128];
};
```