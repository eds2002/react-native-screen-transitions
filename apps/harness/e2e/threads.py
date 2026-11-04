"""threads.py <pid>: prints JSON {thread_id: [name, cpu_ms]} for a process (proc_pidinfo)."""
import ctypes, json, sys
lib = ctypes.CDLL("/usr/lib/libproc.dylib")
pid = int(sys.argv[1])
buf = (ctypes.c_uint64 * 4096)()
n = lib.proc_pidinfo(pid, 6, 0, buf, ctypes.sizeof(buf)) // 8  # PROC_PIDLISTTHREADS
class Info(ctypes.Structure):
    _fields_ = [("user", ctypes.c_uint64), ("system", ctypes.c_uint64), ("cpu", ctypes.c_int32), ("policy", ctypes.c_int32),
                ("run_state", ctypes.c_int32), ("flags", ctypes.c_int32), ("sleep", ctypes.c_int32), ("curpri", ctypes.c_int32),
                ("pri", ctypes.c_int32), ("maxpri", ctypes.c_int32), ("name", ctypes.c_char * 64)]
out = {}
for i in range(n):
    info = Info()
    if lib.proc_pidinfo(pid, 5, ctypes.c_uint64(buf[i]), ctypes.byref(info), ctypes.sizeof(info)) > 0:  # PROC_PIDTHREADINFO
        out[str(buf[i])] = [info.name.decode(errors="replace"), (info.user + info.system) / 1e6, i]
print(json.dumps(out))
