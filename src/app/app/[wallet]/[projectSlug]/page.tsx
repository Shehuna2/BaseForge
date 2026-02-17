import RuntimeAppClient from "@/components/runtime/RuntimeAppClient";

type RuntimePageProps = {
  params: {
    wallet: string;
    projectSlug: string;
  };
};

export default function RuntimePage({ params }: RuntimePageProps) {
  return <RuntimeAppClient wallet={params.wallet} projectSlug={params.projectSlug} />;
}
