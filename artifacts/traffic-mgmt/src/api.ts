const BASE_URL = "http://localhost:3000/api";

export const getIntersections = async () => {
  const res = await fetch(`${BASE_URL}/intersections`);
  return res.json();
};

export const getHospitals = async () => {
  const res = await fetch(`${BASE_URL}/hospitals`);
  return res.json();
};

export const getAmbulances = async () => {
  const res = await fetch(`${BASE_URL}/ambulances`);
  return res.json();
};