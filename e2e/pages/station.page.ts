import { type Page, type Locator } from "@playwright/test";

export class StationPage {
  readonly page: Page;

  readonly addStationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addStationButton = page.getByRole("button", { name: "Add Station" });
  }

  getStationCard(stationName: string) {
    return this.page
      .locator("div")
      .filter({ hasText: stationName })
      .filter({ has: this.page.getByRole("button", { name: "Edit" }) })
      .filter({ has: this.page.getByRole("button", { name: "Delete" }) })
      .last();
  }

  /** Open the "Add Station" dialog */
  async clickAddStation() {
    await this.addStationButton.click();
    await this.page.getByRole("dialog", { name: "Add New Station" }).waitFor();
  }

  /** Fill the create-station form fields */
  async fillCreateStation(name: string, description?: string) {
    await this.page.getByLabel("Station Name").fill(name);
    if (description) {
      await this.page.getByLabel("Description (Optional)").fill(description);
    }
  }

  /** Submit the create-station dialog */
  async submitCreate() {
    await this.page
      .getByRole("dialog", { name: "Add New Station" })
      .getByRole("button", { name: "Create Station" })
      .click();
  }

  /** Open the edit dialog for the station with the given name */
  async clickEdit(stationName: string) {
    await this.getStationCard(stationName).getByRole("button", { name: "Edit" }).click();
    await this.page.getByRole("dialog", { name: "Edit Station" }).waitFor();
  }

  /** Clear and set a new name in the edit dialog, then save */
  async editStation(newName: string, newDescription?: string) {
    const dialog = this.page.getByRole("dialog", { name: "Edit Station" });
    await dialog.getByLabel("Station Name").fill(newName);
    if (newDescription !== undefined) {
      await dialog.getByLabel("Description (Optional)").fill(newDescription);
    }
    await dialog.getByRole("button", { name: "Save Changes" }).click();
  }

  /** Open the delete dialog for the station with the given name */
  async clickDelete(stationName: string) {
    await this.getStationCard(stationName).getByRole("button", { name: "Delete" }).click();
    await this.page.getByRole("dialog", { name: "Delete Station" }).waitFor();
  }

  /** Confirm the delete dialog */
  async confirmDelete() {
    await this.page
      .getByRole("dialog", { name: "Delete Station" })
      .getByRole("button", { name: "Delete Station" })
      .click();
  }
}
