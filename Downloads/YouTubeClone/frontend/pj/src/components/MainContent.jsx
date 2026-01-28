import VideoGrid from "./VideoGrid";

function MainContent({ searchTerm, onOpen }) {
  return <VideoGrid searchTerm={searchTerm} onOpen={onOpen} />;
}

export default MainContent;
