---
author: admin
comments: true
layout: post
slug: 'tokenlinkedtoken tip2'
title: 关于TokenLinkedToken的一点记录2
date: 2018-09-24 20:20:32
categories:
- Tips
---

### 内核原理

```
0: kd> !process 0 1 explorer.exe
PROCESS ffffc306d0c34580
    SessionId: 11  Cid: 44e0    Peb: 006fc000  ParentCid: 5758
    DirBase: 2b1d00002  ObjectTable: ffff8b8e568c7040  HandleCount: 29648.
    Image: explorer.exe
    VadRoot ffffc306ddf5fca0 Vads 1625 Clone 0 Private 403154. Modified 771103. Locked 50.
    DeviceMap ffff8b8e3147ed30
    Token                             ffff8b8e4937f940
    ElapsedTime                       06:29:46.426
    UserTime                          00:00:48.921
    KernelTime                        00:00:53.250
    QuotaPoolUsage[PagedPool]         2123416
    QuotaPoolUsage[NonPagedPool]      225280
    Working Set Sizes (now,min,max)  (56547, 50, 345) (226188KB, 200KB, 1380KB)
    PeakWorkingSetSize                462611
    VirtualSize                       2103798 Mb
    PeakVirtualSize                   2104556 Mb
    PageFaultCount                    2358568
    MemoryPriority                    BACKGROUND
    BasePriority                      8
    CommitCharge                      426963

0: kd> !token ffff8b8e4937f940
_TOKEN 0xffff8b8e4937f940
TS Session ID: 0xb
User: S-1-5-21-3854333306-943506906-3328512208-1001
User Groups: 
 00 S-1-5-21-3854333306-943506906-3328512208-513
    Attributes - Mandatory Default Enabled 
 01 S-1-1-0
    Attributes - Mandatory Default Enabled 
 02 S-1-5-114
    Attributes - DenyOnly 
 03 S-1-5-21-3854333306-943506906-3328512208-1002
    Attributes - Mandatory Default Enabled 
 04 S-1-5-32-544
    Attributes - DenyOnly 
 05 S-1-5-32-559
    Attributes - Mandatory Default Enabled 
 06 S-1-5-32-545
    Attributes - Mandatory Default Enabled 
 07 S-1-5-4
    Attributes - Mandatory Default Enabled 
 08 S-1-2-1
    Attributes - Mandatory Default Enabled 
 09 S-1-5-11
    Attributes - Mandatory Default Enabled 
 10 S-1-5-15
    Attributes - Mandatory Default Enabled 
 11 S-1-5-113
    Attributes - Mandatory Default Enabled 
 12 S-1-5-5-0-4234506195
    Attributes - Mandatory Default Enabled LogonId 
 13 S-1-2-0
    Attributes - Mandatory Default Enabled 
 14 S-1-5-64-10
    Attributes - Mandatory Default Enabled 
 15 S-1-16-8192
    Attributes - GroupIntegrity GroupIntegrityEnabled 
Primary Group: S-1-5-21-3854333306-943506906-3328512208-513
Privs: 
 19 0x000000013 SeShutdownPrivilege               Attributes - Enabled 
 23 0x000000017 SeChangeNotifyPrivilege           Attributes - Enabled Default 
 25 0x000000019 SeUndockPrivilege                 Attributes - 
 33 0x000000021 SeIncreaseWorkingSetPrivilege     Attributes - 
 34 0x000000022 SeTimeZonePrivilege               Attributes - 
Authentication ID:         (0,fc65706c)
Impersonation Level:       Anonymous
TokenType:                 Primary
Source: User32             TokenFlags: 0x2a00 ( Token in use )
Token ID: fc664685         ParentToken ID: fc65706f
Modified ID:               (0, fe4096af)
RestrictedSidCount: 0      RestrictedSids: 0x0000000000000000
OriginatingLogonSession: 3e7
PackageSid: (null)
CapabilityCount: 0      Capabilities: 0x0000000000000000
LowboxNumberEntry: 0x0000000000000000
Security Attributes:


0: kd> dt _TOKEN 0xffff8b8e4937f940
nt!_TOKEN
   +0x000 TokenSource      : _TOKEN_SOURCE
   +0x010 TokenId          : _LUID
   +0x018 AuthenticationId : _LUID
   +0x020 ParentTokenId    : _LUID
   +0x028 ExpirationTime   : _LARGE_INTEGER 0x7fffffff`ffffffff
   +0x030 TokenLock        : 0xffffc306`c7b5dd40 _ERESOURCE
   +0x038 ModifiedId       : _LUID
   +0x040 Privileges       : _SEP_TOKEN_PRIVILEGES
   +0x058 AuditPolicy      : _SEP_AUDIT_POLICY
   +0x078 SessionId        : 0xb
   +0x07c UserAndGroupCount : 0x11
   +0x080 RestrictedSidCount : 0
   +0x084 VariableLength   : 0x228
   +0x088 DynamicCharged   : 0x1000
   +0x08c DynamicAvailable : 0
   +0x090 DefaultOwnerIndex : 0
   +0x098 UserAndGroups    : 0xffff8b8e`4937fdd0 _SID_AND_ATTRIBUTES
   +0x0a0 RestrictedSids   : (null) 
   +0x0a8 PrimaryGroup     : 0xffff8b8e`2b2a3b10 Void
   +0x0b0 DynamicPart      : 0xffff8b8e`2b2a3b10  -> 0x501
   +0x0b8 DefaultDacl      : 0xffff8b8e`2b2a3b2c _ACL
   +0x0c0 TokenType        : 1 ( TokenPrimary )
   +0x0c4 ImpersonationLevel : 0 ( SecurityAnonymous )
   +0x0c8 TokenFlags       : 0x2a00
   +0x0cc TokenInUse       : 0x1 ''
   +0x0d0 IntegrityLevelIndex : 0x10
   +0x0d4 MandatoryPolicy  : 3
   +0x0d8 LogonSession     : 0xffff8b8e`143fc870 _SEP_LOGON_SESSION_REFERENCES
   +0x0e0 OriginatingLogonSession : _LUID
   +0x0e8 SidHash          : _SID_AND_ATTRIBUTES_HASH
   +0x1f8 RestrictedSidHash : _SID_AND_ATTRIBUTES_HASH
   +0x308 pSecurityAttributes : 0xffff8b8e`0c3b7f30 _AUTHZBASEP_SECURITY_ATTRIBUTES_INFORMATION
   +0x310 Package          : (null) 
   +0x318 Capabilities     : (null) 
   +0x320 CapabilityCount  : 0
   +0x328 CapabilitiesHash : _SID_AND_ATTRIBUTES_HASH
   +0x438 LowboxNumberEntry : (null) 
   +0x440 LowboxHandlesEntry : (null) 
   +0x448 pClaimAttributes : (null) 
   +0x450 TrustLevelSid    : (null) 
   +0x458 TrustLinkedToken : (null) 
   +0x460 IntegrityLevelSidValue : (null) 
   +0x468 TokenSidValues   : (null) 
   +0x470 IndexEntry       : 0xffff8b8e`349cd270 _SEP_LUID_TO_INDEX_MAP_ENTRY
   +0x478 DiagnosticInfo   : (null) 
   +0x480 BnoIsolationHandlesEntry : (null) 
   +0x488 SessionObject    : 0xffffc306`cd464140 Void
   +0x490 VariablePart     : 0xffff8b8e`4937fee0

0: kd> dt 0xffff8b8e`143fc870 _SEP_LOGON_SESSION_REFERENCES
nt!_SEP_LOGON_SESSION_REFERENCES
   +0x000 Next             : (null) 
   +0x008 LogonId          : _LUID
   +0x010 BuddyLogonId     : _LUID
   +0x018 ReferenceCount   : 0n1799
   +0x020 Flags            : 0xd
   +0x028 pDeviceMap       : 0xffff8b8e`3147ed30 _DEVICE_MAP
   +0x030 Token            : 0xffff8b8e`20c65060 Void
   +0x038 AccountName      : _UNICODE_STRING "win"
   +0x048 AuthorityName    : _UNICODE_STRING "DESKTOP-GJGV2E2"
   +0x058 CachedHandlesTable : _SEP_CACHED_HANDLES_TABLE
   +0x068 SharedDataLock   : _EX_PUSH_LOCK
   +0x070 SharedClaimAttributes : (null) 
   +0x078 SharedSidValues  : (null) 
   +0x080 RevocationBlock  : _OB_HANDLE_REVOCATION_BLOCK
   +0x0a0 ServerSilo       : (null) 
   +0x0a8 SiblingAuthId    : _LUID
   +0x0b0 TokenList        : _LIST_ENTRY [ 0x00000000`00000000 - 0x00000000`00000000 ]


0: kd> dt 0xffff8b8e`143fc870 _SEP_LOGON_SESSION_REFERENCES BuddyLogonId.
nt!_SEP_LOGON_SESSION_REFERENCES
   +0x010 BuddyLogonId  : 
      +0x000 LowPart       : 0xfc657047
      +0x004 HighPart      : 0n0

0: kd> ? 0xfc657047&0xf
Evaluate expression: 7 = 00000000`00000007

0: kd> dq nt!SepLogonSessions L1
fffff802`45a744a0  ffff8b8e`0b0020d0
0: kd> dq ffff8b8e`0b0020d0+8*7 L1
ffff8b8e`0b002108  ffff8b8e`367ef010

0: kd> dt ffff8b8e`367ef010 _SEP_LOGON_SESSION_REFERENCES
nt!_SEP_LOGON_SESSION_REFERENCES
   +0x000 Next             : 0xffff8b8e`593ba230 _SEP_LOGON_SESSION_REFERENCES
   +0x008 LogonId          : _LUID
   +0x010 BuddyLogonId     : _LUID
   +0x018 ReferenceCount   : 0n56
   +0x020 Flags            : 0xa
   +0x028 pDeviceMap       : 0xffff8b8e`0e5e0890 _DEVICE_MAP
   +0x030 Token            : 0xffff8b8e`15b56940 Void
   +0x038 AccountName      : _UNICODE_STRING "win"
   +0x048 AuthorityName    : _UNICODE_STRING "DESKTOP-GJGV2E2"
   +0x058 CachedHandlesTable : _SEP_CACHED_HANDLES_TABLE
   +0x068 SharedDataLock   : _EX_PUSH_LOCK
   +0x070 SharedClaimAttributes : (null) 
   +0x078 SharedSidValues  : (null) 
   +0x080 RevocationBlock  : _OB_HANDLE_REVOCATION_BLOCK
   +0x0a0 ServerSilo       : (null) 
   +0x0a8 SiblingAuthId    : _LUID
   +0x0b0 TokenList        : _LIST_ENTRY [ 0x00000000`00000000 - 0x00000000`00000000 ]
   
0: kd> !token 0xffff8b8e`15b56940
_TOKEN 0xffff8b8e15b56940
TS Session ID: 0xb
User: S-1-5-21-3854333306-943506906-3328512208-1001
User Groups: 
 00 S-1-5-21-3854333306-943506906-3328512208-513
    Attributes - Mandatory Default Enabled 
 01 S-1-1-0
    Attributes - Mandatory Default Enabled 
 02 S-1-5-114
    Attributes - Mandatory Default Enabled 
 03 S-1-5-21-3854333306-943506906-3328512208-1002
    Attributes - Mandatory Default Enabled 
 04 S-1-5-32-544
    Attributes - Mandatory Default Enabled Owner 
 05 S-1-5-32-559
    Attributes - Mandatory Default Enabled 
 06 S-1-5-32-545
    Attributes - Mandatory Default Enabled 
 07 S-1-5-4
    Attributes - Mandatory Default Enabled 
 08 S-1-2-1
    Attributes - Mandatory Default Enabled 
 09 S-1-5-11
    Attributes - Mandatory Default Enabled 
 10 S-1-5-15
    Attributes - Mandatory Default Enabled 
 11 S-1-5-113
    Attributes - Mandatory Default Enabled 
 12 S-1-5-5-0-4234506195
    Attributes - Mandatory Default Enabled LogonId 
 13 S-1-2-0
    Attributes - Mandatory Default Enabled 
 14 S-1-5-64-10
    Attributes - Mandatory Default Enabled 
 15 S-1-16-12288
    Attributes - GroupIntegrity GroupIntegrityEnabled 
Primary Group: S-1-5-21-3854333306-943506906-3328512208-513
Privs: 
 05 0x000000005 SeIncreaseQuotaPrivilege          Attributes - 
 08 0x000000008 SeSecurityPrivilege               Attributes - 
 09 0x000000009 SeTakeOwnershipPrivilege          Attributes - 
 10 0x00000000a SeLoadDriverPrivilege             Attributes - 
 11 0x00000000b SeSystemProfilePrivilege          Attributes - 
 12 0x00000000c SeSystemtimePrivilege             Attributes - 
 13 0x00000000d SeProfileSingleProcessPrivilege   Attributes - 
 14 0x00000000e SeIncreaseBasePriorityPrivilege   Attributes - 
 15 0x00000000f SeCreatePagefilePrivilege         Attributes - 
 17 0x000000011 SeBackupPrivilege                 Attributes - 
 18 0x000000012 SeRestorePrivilege                Attributes - 
 19 0x000000013 SeShutdownPrivilege               Attributes - 
 20 0x000000014 SeDebugPrivilege                  Attributes - 
 22 0x000000016 SeSystemEnvironmentPrivilege      Attributes - 
 23 0x000000017 SeChangeNotifyPrivilege           Attributes - Enabled Default 
 24 0x000000018 SeRemoteShutdownPrivilege         Attributes - 
 25 0x000000019 SeUndockPrivilege                 Attributes - 
 28 0x00000001c SeManageVolumePrivilege           Attributes - 
 29 0x00000001d SeImpersonatePrivilege            Attributes - Enabled Default 
 30 0x00000001e SeCreateGlobalPrivilege           Attributes - Enabled Default 
 33 0x000000021 SeIncreaseWorkingSetPrivilege     Attributes - 
 34 0x000000022 SeTimeZonePrivilege               Attributes - 
 35 0x000000023 SeCreateSymbolicLinkPrivilege     Attributes - 
 36 0x000000024 SeDelegateSessionUserImpersonatePrivilege  Attributes - 
Authentication ID:         (0,fc657047)
Impersonation Level:       Anonymous
TokenType:                 Primary
Source: User32             TokenFlags: 0x2020 ( Token NOT in use ) 
Token ID: fc657079         ParentToken ID: 0
Modified ID:               (0, fc65706b)
RestrictedSidCount: 0      RestrictedSids: 0x0000000000000000
OriginatingLogonSession: 3e7
PackageSid: (null)
CapabilityCount: 0      Capabilities: 0x0000000000000000
LowboxNumberEntry: 0x0000000000000000
Security Attributes:

```