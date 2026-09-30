export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  placeId?: string;
}

export const parseGoogleAddressComponents = (components: any[]): Partial<LocationData> => {
  let subdistrict = '';
  let district = '';
  let province = '';
  let postalCode = '';

  components.forEach((comp) => {
    const types = comp.types || [];
    if (types.includes('sublocality_level_2') || types.includes('sublocality')) {
      subdistrict = comp.long_name;
    } else if (types.includes('sublocality_level_1') || types.includes('locality')) {
      district = comp.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      province = comp.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = comp.long_name;
    }
  });

  return { subdistrict, district, province, postalCode };
};
