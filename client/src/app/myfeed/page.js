"use client"
import MyFeed from '@/components/MyFeed';
import withAuth from '@/components/withAuth';

function MyFeedPage() {
    return <MyFeed />;
}

export default withAuth(MyFeedPage);
