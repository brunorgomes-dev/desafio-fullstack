import axios from 'axios';

export const getAddressByCep = async (cep: string) => {
  // A URL da ViaCEP é pública e retorna JSON
  const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
  return response.data;
};