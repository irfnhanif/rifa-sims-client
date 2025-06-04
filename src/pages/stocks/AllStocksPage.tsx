import StockListPageTemplate from "../../components/StockListPageTemplate";

const AllStocksPage: React.FC = () => {
  return (
    <StockListPageTemplate
      mode="all"
      title="Daftar Stok Barang"
      showBackButton={true}
    />
  );
};

export default AllStocksPage;
