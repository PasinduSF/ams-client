const isoToCustomFormat = (isoString) => {
  try {
    const date = new Date(isoString);

    // Format year/month/day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Format hours and minutes
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12

    return `${year}/${month}/${day} ${hours}.${minutes} ${ampm}`;
  } catch (error) {
    console.error("Error converting from ISO format:", error);
    return null;
  }
};

export { isoToCustomFormat };
