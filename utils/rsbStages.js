/**
 * RSB Under Carriage / Track Frame — Stage Definitions
 *
 * Stage 0 = auto-recorded when QR is printed (order creation).
 * All subsequent stages must be recorded in strict serial order.
 */

const STAGE_DEFINITIONS = {
  CAR_BODY: [
    'Car Body Created',                     // 0 — auto-recorded at QR print
    'Car Body Assembly Start',              // 1
    'Car Body Assembly End',                // 2
    'Box Welding Start',                    // 3
    'Box Welding End',                      // 4
    'Lower Frame Welding Start',            // 5
    'Lower Frame Welding End',              // 6
    'Car Body Machining Start',             // 7
    'Car Body Machining End',               // 8 — Car Body + Flange ready
    'Under Carriage Assembly Start',        // 9 — Master QR takes over
    'Under Carriage Assembly End',          // 10
    'Under Carriage Welding Start',         // 11
    'Under Carriage Welding End',           // 12
    'Under Carriage Dressing & TPI Start',  // 13
    'Under Carriage Dressing & TPI End',    // 14
    'Under Carriage Ready for Dispatch',    // 15 — FINAL
  ],

  LEFT_SIDE_FRAME: [
    'Left Side Frame Created',              // 0 — auto-recorded at QR print
    'Left Side Frame Motor Assembly Start', // 1
    'Left Side Frame Motor Assembly End',   // 2
    'Left Side Frame Motor Welding Start',  // 3
    'Left Side Frame Motor Welding End',    // 4
    'Left Side Frame Motor Drilling Start', // 5
    'Left Side Frame Motor Drilling End',   // 6
    'Left Side Frame Idler Assembly Start', // 7
    'Left Side Frame Idler Assembly End',   // 8
    'Left Side Frame Idler Welding Start',  // 9
    'Left Side Frame Idler Welding End',    // 10 — FINAL (LSF + Motor Bracket LH + Idler Bracket LH ready)
  ],

  RIGHT_SIDE_FRAME: [
    'Right Side Frame Created',              // 0 — auto-recorded at QR print
    'Right Side Frame Motor Assembly Start', // 1
    'Right Side Frame Motor Assembly End',   // 2
    'Right Side Frame Motor Welding Start',  // 3
    'Right Side Frame Motor Welding End',    // 4
    'Right Side Frame Motor Drilling Start', // 5
    'Right Side Frame Motor Drilling End',   // 6
    'Right Side Frame Idler Assembly Start', // 7
    'Right Side Frame Idler Assembly End',   // 8
    'Right Side Frame Idler Welding Start',  // 9
    'Right Side Frame Idler Welding End',    // 10 — FINAL (RSF + Motor Bracket RH + Idler Bracket RH ready)
  ],
};

const COMPONENT_DISPLAY_NAMES = {
  CAR_BODY: 'Car Body',
  LEFT_SIDE_FRAME: 'Left Side Frame',
  RIGHT_SIDE_FRAME: 'Right Side Frame',
};

// Milestone stage indices per component type
const MILESTONES = {
  CAR_BODY: {
    subAssemblyComplete: 8,  // Car Body + Flange ready
    finalDispatch: 15,       // Under Carriage Ready for Dispatch
  },
  LEFT_SIDE_FRAME: {
    complete: 10,            // LSF + Motor Bracket LH + Idler Bracket LH ready
  },
  RIGHT_SIDE_FRAME: {
    complete: 10,            // RSF + Motor Bracket RH + Idler Bracket RH ready
  },
};

module.exports = { STAGE_DEFINITIONS, COMPONENT_DISPLAY_NAMES, MILESTONES };
