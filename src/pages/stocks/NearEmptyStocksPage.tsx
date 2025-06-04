import StockListPageTemplate from "../../components/StockListPageTemplate";

const NearEmptyStocksPage: React.FC = () => {
  return (
    <StockListPageTemplate
      mode="near-empty"
      title="Daftar Stok Barang Menipis"
      showBackButton={true}
    />
  );
};

export default NearEmptyStocksPage;
