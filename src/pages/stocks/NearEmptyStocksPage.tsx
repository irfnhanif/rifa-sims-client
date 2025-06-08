import StockListPageTemplate from "../../components/StockListPageTemplate";

const NearEmptyStocksPage: React.FC = () => {
  return (
    <StockListPageTemplate
      mode="near-empty"
      title="Daftar Stok Barang Habis"
      showBackButton={true}
    />
  );
};

export default NearEmptyStocksPage;
