import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from "@nrwl/nx-plugin/testing";

describe("nx-angular-generators e2e", () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    // ensureNxProject("@trifork/nx-angular-generators", "dist");
  });

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    // runNxCommandAsync("reset");
  });

  it.only("should create nx-angular-generators", (done) => {
    const domain = uniq("testdomain");
    const substore = uniq("substore");
    console.log("test");
    let buildresult: Promise<{ stdout: string }>;

    buildresult = runNxCommandAsync(`run nx-angular-generators:build`, {
      silenceError: false,
    });
    buildresult
      .then((inp) => {
        // eslint-disable-next-line no-console
        // eslint-disable-next-line no-console
        console.log("isrun");
        expect(inp.stdout).toContain("Executor ran");
        done();
      })
      .catch((inp) => {
        // eslint-disable-next-line no-console
        debugger;
        console.log("err: ", inp);
        done();
      });
    // runNxCommandAsync(
    //   `generate @trifork/nx-angular-generators:state ${domain} ${substore}`
    // ).then(done());
  }, 120000);

  describe("--directory", () => {
    it("should create src in the specified directory", async () => {
      const project = uniq("nx-angular-generators");
      await runNxCommandAsync(
        `generate @trifork/nx-angular-generators:nx-angular-generators ${project} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${project}/src/index.ts`)
      ).not.toThrow();
    }, 120000);
  });

  describe("--tags", () => {
    it("should add tags to the project", async () => {
      const projectName = uniq("nx-angular-generators");
      ensureNxProject("@trifork/nx-angular-generators", "dist");
      await runNxCommandAsync(
        `generate @trifork/nx-angular-generators:nx-angular-generators ${projectName} --tags e2etag,e2ePackage`
      );
      const project = readJson(`libs/${projectName}/project.json`);
      expect(project.tags).toEqual(["e2etag", "e2ePackage"]);
    }, 120000);
  });
});
