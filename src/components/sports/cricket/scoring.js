export const handleRuns = (data, event, type) => {
  data.event = event;
  data.eventType = event == 4 || event == 6 ? "boundary" : "run";
  data.isLegal = true;
  data.comment = "";

  return data;
};
export const handleUndo = (data) => {
  data.undo = true;
  return data;
};
export const handleEndInnings = (data) => {
  data.eventType = "End_Innings";
  data.undo = false;

  return data;
};
