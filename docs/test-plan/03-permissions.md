## 3. Permissions Testing (Manual)

**Goal:** Verify camera and media library permissions are requested correctly and handled gracefully.

- [x] First time using 'Take a Photo':
    - [x] Verify camera permission prompt appears.
    - [x] Grant permission: Verify camera opens.
    - [ ] Deny permission: Verify friendly error message (`CAMERA_PERMISSION_DENIED`) is shown and camera does not open.
- [ ] First time using 'Photo Library':
    - [ ] Verify media library permission prompt appears.
    - [ ] Grant permission: Verify library opens.
    - [ ] Deny permission: Verify friendly error message (`MEDIA_LIBRARY_PERMISSION_DENIED`) is shown and library does not open.
- [ ] Subsequent uses after granting permission:
    - [ ] Verify permissions are not requested again.
    - [ ] Verify features work directly.
- [ ] Test after denying permission and then re-attempting:
    - [ ] Verify the error message is shown again, potentially directing user to settings. 